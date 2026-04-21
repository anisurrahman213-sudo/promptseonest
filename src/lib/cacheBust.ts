/**
 * Cache-busting utilities used after Publish/Update so the live site
 * picks up the latest build immediately instead of serving stale
 * service-worker / browser caches.
 */

import { supabase } from '@/integrations/supabase/client';

export const BUILD_INFO_URL = '/build-info.json';
const DEPLOYMENT_VERSION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-deployment-version`;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const LS_LAST_SEEN_BUILD = 'pn_last_seen_build';

export interface BuildInfo {
  buildTime: string;
  version?: string;
  source?: 'static' | 'deployment_versions';
  deployedAt?: string;
  notes?: string;
}

/** Read the currently running build's timestamp (injected at build time). */
export function getRunningBuildTime(): string {
  try {
    // @ts-ignore - injected via vite define
    return typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '';
  } catch {
    return '';
  }
}

/**
 * Fetch the latest build manifest. Prefers the backend `get-deployment-version`
 * edge function (authoritative — what an admin actually marked as deployed),
 * and falls back to the static `/build-info.json` from the served bundle.
 */
export async function fetchLatestBuildInfo(signal?: AbortSignal): Promise<BuildInfo | null> {
  // 1. Authoritative: backend deployment registry
  try {
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;
    const res = await fetch(`${DEPLOYMENT_VERSION_URL}?t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      signal,
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

    if (res.ok) {
      const data = (await res.json()) as BuildInfo | null;
      if (data?.buildTime) {
        return {
          buildTime: data.buildTime as string,
          version: data.version ?? undefined,
          deployedAt: data.deployedAt ?? undefined,
          notes: data.notes ?? undefined,
          source: 'deployment_versions',
        };
      }
    }
  } catch {/* fall through to static manifest */}

  // 2. Back-compat fallback: older client path using invoke() / POST
  try {
    const { data, error } = await supabase.functions.invoke('get-deployment-version');
    if (!error && data?.buildTime) {
      return {
        buildTime: data.buildTime as string,
        version: data.version ?? undefined,
        deployedAt: data.deployedAt ?? undefined,
        notes: data.notes ?? undefined,
        source: 'deployment_versions',
      };
    }
  } catch {/* fall through to static manifest */}

  // 3. Fallback: static build-info.json from the served bundle
  try {
    const res = await fetch(`${BUILD_INFO_URL}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'cache-control': 'no-cache, no-store, max-age=0' },
      signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { buildTime?: string; version?: string };
    if (!json?.buildTime) return null;
    return { buildTime: json.buildTime, version: json.version, source: 'static' };
  } catch {
    return null;
  }
}

/**
 * Record a new deployment server-side. Admin-only; backend enforces.
 * Returns true on success.
 */
export async function recordDeployment(opts: { buildTime?: string; notes?: string; version?: string } = {}): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('record-deployment', {
      body: {
        buildTime: opts.buildTime ?? getRunningBuildTime() ?? new Date().toISOString(),
        notes: opts.notes,
        version: opts.version,
      },
    });
    if (error) {
      console.error('[recordDeployment] error:', error.message);
      return false;
    }
    return !!data?.success;
  } catch (err) {
    console.error('[recordDeployment] failed:', err);
    return false;
  }
}

/**
 * Purge every cache layer we control:
 *  - Service Worker registrations (forces re-fetch of fresh SW + assets)
 *  - CacheStorage (workbox runtime caches)
 *  - HTTP cache via location.reload() with reload semantics
 */
export async function purgeAllCaches(): Promise<void> {
  // 1. Unregister service workers so the next load fetches the latest SW
  if ('serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
    } catch {/* ignore */}
  }
  // 2. Delete every CacheStorage bucket (workbox precache + runtime)
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    } catch {/* ignore */}
  }
}

/** Persist the build version we just loaded, so polling can compare. */
export function rememberCurrentBuild(): void {
  try {
    const t = getRunningBuildTime();
    if (t) localStorage.setItem(LS_LAST_SEEN_BUILD, t);
  } catch {/* ignore */}
}

export function getLastSeenBuild(): string | null {
  try {
    return localStorage.getItem(LS_LAST_SEEN_BUILD);
  } catch {
    return null;
  }
}

/**
 * Full cache-bust flow: clear all caches, then hard-reload the page
 * with a cache-busting query param so the browser HTTP cache is bypassed too.
 */
export async function cacheBustAndReload(): Promise<void> {
  await purgeAllCaches();
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('_v', Date.now().toString(36));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

/**
 * Compare two build timestamps. Returns true when `latest` is newer than
 * `current` (handles ISO strings; falls back to strict inequality).
 */
export function isNewerBuild(latest: string, current: string): boolean {
  if (!latest || !current) return false;
  if (latest === current) return false;
  const a = new Date(latest).getTime();
  const b = new Date(current).getTime();
  if (!isNaN(a) && !isNaN(b)) return a > b;
  return latest !== current;
}
