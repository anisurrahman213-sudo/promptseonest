#!/usr/bin/env node
/**
 * i18n consistency validator.
 *
 * Compares all locale files in src/i18n/locales/ against en.json (the source of truth).
 * Fails (exit 1) if any locale has missing or extra keys, or if a value is empty.
 *
 * Usage:
 *   node scripts/check-i18n.mjs
 *   npm run check:i18n
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, "..", "src", "i18n", "locales");
const REFERENCE = "en";

/** Recursively flatten a nested object into dot-notation keys. */
function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, full));
    } else {
      out[full] = v;
    }
  }
  return out;
}

function loadLocale(code) {
  const path = join(LOCALES_DIR, `${code}.json`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    console.error(`✗ Failed to parse ${code}.json: ${e.message}`);
    process.exit(1);
  }
}

function main() {
  const files = readdirSync(LOCALES_DIR).filter((f) => f.endsWith(".json"));
  const codes = files.map((f) => basename(f, ".json")).sort();

  if (!codes.includes(REFERENCE)) {
    console.error(`✗ Reference locale "${REFERENCE}.json" not found in ${LOCALES_DIR}`);
    process.exit(1);
  }

  const reference = flatten(loadLocale(REFERENCE));
  const refKeys = new Set(Object.keys(reference));

  console.log(`📚 i18n consistency check`);
  console.log(`   Reference: ${REFERENCE}.json (${refKeys.size} keys)`);
  console.log(`   Checking ${codes.length - 1} other locale(s)...\n`);

  let hadErrors = false;

  for (const code of codes) {
    if (code === REFERENCE) continue;

    const flat = flatten(loadLocale(code));
    const keys = new Set(Object.keys(flat));
    const missing = [...refKeys].filter((k) => !keys.has(k)).sort();
    const extra = [...keys].filter((k) => !refKeys.has(k)).sort();
    const empty = Object.entries(flat)
      .filter(([_, v]) => typeof v === "string" && v.trim() === "")
      .map(([k]) => k)
      .sort();

    const ok = missing.length === 0 && extra.length === 0 && empty.length === 0;
    const icon = ok ? "✓" : "✗";

    if (ok) {
      console.log(`${icon} ${code}: ${keys.size} keys — OK`);
      continue;
    }

    hadErrors = true;
    console.log(`${icon} ${code}: ${keys.size} keys`);
    if (missing.length) {
      console.log(`   Missing (${missing.length}):`);
      for (const k of missing.slice(0, 25)) console.log(`     - ${k}`);
      if (missing.length > 25) console.log(`     … and ${missing.length - 25} more`);
    }
    if (extra.length) {
      console.log(`   Extra (${extra.length}):`);
      for (const k of extra.slice(0, 25)) console.log(`     + ${k}`);
      if (extra.length > 25) console.log(`     … and ${extra.length - 25} more`);
    }
    if (empty.length) {
      console.log(`   Empty values (${empty.length}):`);
      for (const k of empty.slice(0, 25)) console.log(`     ⚠ ${k}`);
      if (empty.length > 25) console.log(`     … and ${empty.length - 25} more`);
    }
  }

  console.log("");
  if (hadErrors) {
    console.error("❌ i18n inconsistencies detected. Fix the locale files above before merging.");
    console.error("   Tip: keep en.json as source of truth; mirror its keys in every other locale.");
    process.exit(1);
  }
  console.log("✅ All locale files are consistent.");
}

main();
