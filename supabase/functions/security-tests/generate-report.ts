/**
 * Security Test Report Generator
 *
 * Runs all Deno security test files, captures pass/fail status per assertion,
 * and emits an auditable report in JSON + Markdown.
 *
 * Usage (local or CI):
 *   deno run --allow-net --allow-env --allow-read --allow-run --allow-write \
 *     supabase/functions/security-tests/generate-report.ts
 *
 * Outputs (written next to this script):
 *   - security-report.json   machine-readable, full per-test detail
 *   - security-report.md     human-readable audit summary
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";

type TestResult = {
  name: string;
  status: "passed" | "failed" | "ignored";
  durationMs: number;
  error?: string;
};

type SuiteResult = {
  file: string;
  scope: string;
  total: number;
  passed: number;
  failed: number;
  ignored: number;
  durationMs: number;
  tests: TestResult[];
};

const SUITES: Array<{ file: string; scope: string }> = [
  {
    file: "index.test.ts",
    scope: "Anonymous access — RLS read/write denial on protected tables and SECURITY DEFINER RPC gating",
  },
  {
    file: "auth-rls.test.ts",
    scope: "Authenticated users — per-user ownership for generations, submission_tracking, payment_requests, and credit deduction",
  },
  {
    file: "negative-path.test.ts",
    scope: "Malformed/missing parameters — sensitive RPC calls and protected-table inserts must fail safely",
  },
];

// Inventory of what these suites cover (kept in sync with the test files).
const COVERAGE = {
  tables: [
    "user_profiles",
    "user_roles",
    "credits",
    "generations",
    "submission_tracking",
    "payment_requests",
    "deployment_versions",
    "login_attempts",
    "site_settings",
    "pricing_plans",
  ],
  rpcs: [
    "has_role",
    "deduct_credit",
    "deduct_credit(p_user_id)",
    "add_credits",
    "get_admin_user_view",
    "get_credit_cost",
    "get_user_email",
    "is_account_locked",
    "get_lock_remaining_seconds",
    "sync_user_emails",
  ],
  policies: [
    "user_profiles: owner-only SELECT/UPDATE; credits column trigger-protected",
    "user_roles: SELECT via has_role only; no client INSERT/UPDATE/DELETE",
    "submission_tracking: owner SELECT/INSERT/UPDATE; status/rejection_reason/reviewed_at admin-only",
    "payment_requests: owner SELECT/INSERT; status/amount/plan_name admin-only via trigger",
    "generations: owner-only CRUD",
    "deployment_versions: admin-only SELECT",
    "login_attempts: no public access; managed via SECURITY DEFINER funcs",
  ],
};

async function runSuite(file: string, scope: string): Promise<SuiteResult> {
  const cwd = new URL(".", import.meta.url).pathname;
  const started = performance.now();

  const cmd = new Deno.Command("deno", {
    args: [
      "test",
      "--allow-net",
      "--allow-env",
      "--allow-read",
      "--no-check",
      "--reporter=tap",
      file,
    ],
    cwd,
    stdout: "piped",
    stderr: "piped",
    env: {
      ...Deno.env.toObject(),
      NO_COLOR: "1",
    },
  });

  const { stdout, stderr } = await cmd.output();
  const out = new TextDecoder().decode(stdout);
  const err = new TextDecoder().decode(stderr);
  const durationMs = Math.round(performance.now() - started);

  const tests = parseTap(out + "\n" + err);
  return {
    file,
    scope,
    total: tests.length,
    passed: tests.filter((t) => t.status === "passed").length,
    failed: tests.filter((t) => t.status === "failed").length,
    ignored: tests.filter((t) => t.status === "ignored").length,
    durationMs,
    tests,
  };
}

/**
 * Minimal TAP parser tolerant of Deno's test reporter output.
 * Recognizes:  ok N - name   |   not ok N - name   |   # SKIP / # IGNORED
 */
function parseTap(raw: string): TestResult[] {
  const tests: TestResult[] = [];
  const lines = raw.split(/\r?\n/);
  let pending: TestResult | null = null;
  const errBuf: string[] = [];

  const flush = () => {
    if (pending) {
      if (errBuf.length) pending.error = errBuf.join("\n").trim();
      tests.push(pending);
      pending = null;
      errBuf.length = 0;
    }
  };

  for (const line of lines) {
    const ok = line.match(/^ok\s+\d+\s+-\s+(.+?)(?:\s+#\s+(SKIP|IGNORED).*)?$/i);
    const notOk = line.match(/^not ok\s+\d+\s+-\s+(.+)$/i);
    if (ok) {
      flush();
      pending = {
        name: ok[1].trim(),
        status: ok[2] ? "ignored" : "passed",
        durationMs: 0,
      };
      flush();
      continue;
    }
    if (notOk) {
      flush();
      pending = { name: notOk[1].trim(), status: "failed", durationMs: 0 };
      continue;
    }
    if (pending && pending.status === "failed") {
      if (line.startsWith("#") || line.trim().startsWith("at ") || line.includes("Error")) {
        errBuf.push(line);
      }
    }
  }
  flush();
  return tests;
}

function renderMarkdown(
  suites: SuiteResult[],
  totals: { passed: number; failed: number; ignored: number; total: number; durationMs: number },
  generatedAt: string,
): string {
  const status = totals.failed === 0 ? "PASS" : "FAIL";
  const lines: string[] = [];
  lines.push(`# Security Test Report`);
  lines.push("");
  lines.push(`- **Status:** ${status}`);
  lines.push(`- **Generated:** ${generatedAt}`);
  lines.push(
    `- **Totals:** ${totals.passed} passed, ${totals.failed} failed, ${totals.ignored} ignored (of ${totals.total})`,
  );
  lines.push(`- **Duration:** ${totals.durationMs} ms`);
  lines.push("");

  lines.push(`## Coverage Inventory`);
  lines.push("");
  lines.push(`### Tables checked`);
  COVERAGE.tables.forEach((t) => lines.push(`- \`${t}\``));
  lines.push("");
  lines.push(`### RPCs checked`);
  COVERAGE.rpcs.forEach((r) => lines.push(`- \`${r}\``));
  lines.push("");
  lines.push(`### Policies asserted`);
  COVERAGE.policies.forEach((p) => lines.push(`- ${p}`));
  lines.push("");

  lines.push(`## Suites`);
  for (const s of suites) {
    const sStatus = s.failed === 0 ? "PASS" : "FAIL";
    lines.push("");
    lines.push(`### ${s.file} — ${sStatus}`);
    lines.push(`_${s.scope}_`);
    lines.push("");
    lines.push(
      `Passed: **${s.passed}** · Failed: **${s.failed}** · Ignored: **${s.ignored}** · Duration: ${s.durationMs} ms`,
    );
    lines.push("");
    lines.push(`| # | Status | Test |`);
    lines.push(`|---|--------|------|`);
    s.tests.forEach((t, i) => {
      const icon = t.status === "passed" ? "✅" : t.status === "failed" ? "❌" : "⚪";
      lines.push(`| ${i + 1} | ${icon} ${t.status} | ${escapeMd(t.name)} |`);
    });

    const failed = s.tests.filter((t) => t.status === "failed");
    if (failed.length) {
      lines.push("");
      lines.push(`#### Failures`);
      for (const f of failed) {
        lines.push("");
        lines.push(`- **${escapeMd(f.name)}**`);
        if (f.error) {
          lines.push("  ```");
          lines.push(`  ${f.error.split("\n").slice(0, 8).join("\n  ")}`);
          lines.push("  ```");
        }
      }
    }
  }

  return lines.join("\n") + "\n";
}

function escapeMd(s: string): string {
  return s.replace(/\|/g, "\\|");
}

async function main() {
  const generatedAt = new Date().toISOString();
  const suites: SuiteResult[] = [];

  for (const s of SUITES) {
    console.log(`▶ Running ${s.file} ...`);
    const result = await runSuite(s.file, s.scope);
    console.log(
      `   ${result.passed} passed · ${result.failed} failed · ${result.ignored} ignored (${result.durationMs}ms)`,
    );
    suites.push(result);
  }

  const totals = suites.reduce(
    (acc, s) => ({
      passed: acc.passed + s.passed,
      failed: acc.failed + s.failed,
      ignored: acc.ignored + s.ignored,
      total: acc.total + s.total,
      durationMs: acc.durationMs + s.durationMs,
    }),
    { passed: 0, failed: 0, ignored: 0, total: 0, durationMs: 0 },
  );

  const report = {
    generatedAt,
    project: "promptseonest",
    status: totals.failed === 0 ? "pass" : "fail",
    totals,
    coverage: COVERAGE,
    suites,
  };

  const dir = new URL(".", import.meta.url).pathname;
  const jsonPath = `${dir}security-report.json`;
  const mdPath = `${dir}security-report.md`;

  await Deno.writeTextFile(jsonPath, JSON.stringify(report, null, 2));
  await Deno.writeTextFile(mdPath, renderMarkdown(suites, totals, generatedAt));

  console.log(`\n✔ Report written:`);
  console.log(`   - ${jsonPath}`);
  console.log(`   - ${mdPath}`);
  console.log(
    `\nSummary: ${totals.passed}/${totals.total} passed · ${totals.failed} failed · ${totals.ignored} ignored`,
  );

  if (totals.failed > 0) Deno.exit(1);
}

if (import.meta.main) {
  await main();
}
