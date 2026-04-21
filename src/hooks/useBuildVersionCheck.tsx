import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  fetchLatestBuildInfo,
  getRunningBuildTime,
  isNewerBuild,
  cacheBustAndReload,
  rememberCurrentBuild,
} from '@/lib/cacheBust';

interface Options {
  /** Polling interval in ms. Default 60s. */
  intervalMs?: number;
  /** Show a toast and let user opt-in instead of auto-reloading. Default true. */
  promptUser?: boolean;
}

/**
 * Periodically polls /build-info.json and detects when a newer build
 * has been published. When detected:
 *  - if `promptUser` is true, shows a sonner toast with a "Reload" action
 *  - otherwise auto cache-busts and reloads
 *
 * Also reacts to:
 *  - window 'focus' (re-check on tab refocus)
 *  - 'online' event (re-check after network resume)
 */
export function useBuildVersionCheck(opts: Options = {}) {
  const { intervalMs = 60_000, promptUser = true } = opts;
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const promptedRef = useRef(false);

  useEffect(() => {
    // Persist current build on first mount so PublishChecklist + UI know it
    rememberCurrentBuild();

    let timer: number | null = null;
    let cancelled = false;
    const controller = new AbortController();

    const check = async () => {
      if (cancelled) return;
      const info = await fetchLatestBuildInfo(controller.signal);
      if (!info?.buildTime) return;
      const current = getRunningBuildTime();
      if (!current) return;
      if (!isNewerBuild(info.buildTime, current)) return;

      setUpdateAvailable(true);

      if (!promptUser) {
        await cacheBustAndReload();
        return;
      }

      if (promptedRef.current) return;
      promptedRef.current = true;
      toast.info('A new version is available', {
        description: 'Reload to get the latest UI updates.',
        duration: Infinity,
        action: {
          label: 'Reload now',
          onClick: () => { void cacheBustAndReload(); },
        },
      });
    };

    // Initial check shortly after mount (don't block first paint)
    const initialDelay = window.setTimeout(check, 4_000);

    timer = window.setInterval(check, intervalMs);

    const onFocus = () => { void check(); };
    const onOnline = () => { void check(); };
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(initialDelay);
      if (timer != null) window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }, [intervalMs, promptUser]);

  return { updateAvailable };
}
