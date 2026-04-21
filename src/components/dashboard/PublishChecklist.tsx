import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Rocket,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Globe,
  Server,
  Layout,
  X,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Cloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  cacheBustAndReload,
  fetchLatestBuildInfo,
  recordDeployment,
  getRunningBuildTime,
  isNewerBuild,
  type BuildInfo,
} from '@/lib/cacheBust';
import { toast } from 'sonner';
import { useIsAdmin } from '@/hooks/usePaymentRequests';

const LS_LAST_PUBLISHED = 'pn_last_published_at';
const LS_DISMISSED_VERSION = 'pn_publish_checklist_dismissed_for';
const LS_COLLAPSED = 'pn_publish_checklist_collapsed';

/**
 * Build-time marker. Vite injects a fresh timestamp each rebuild, so this
 * value reliably increases whenever a frontend change ships to preview.
 * In dev (no BUILD_TIME), fall back to current time so the UI still works.
 */
function getCurrentBuildId(): string {
  // @ts-ignore - injected at build (vite define)
  const t: string | undefined = (typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : undefined);
  if (t && t.length > 0) return t;
  // Dev fallback: use page-load minute bucket (so it doesn't change every render)
  const d = new Date();
  return `dev-${d.getUTCFullYear()}${d.getUTCMonth()}${d.getUTCDate()}${d.getUTCHours()}${d.getUTCMinutes()}`;
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'never';
  const then = new Date(iso).getTime();
  if (isNaN(then)) return 'unknown';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  icon: typeof Layout;
  category: 'frontend' | 'backend';
  done: boolean;
}

export function PublishChecklist() {
  const buildId = useMemo(() => getCurrentBuildId(), []);
  const { data: isAdmin } = useIsAdmin();
  const [lastPublished, setLastPublished] = useState<string | null>(null);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [liveBuild, setLiveBuild] = useState<BuildInfo | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [recording, setRecording] = useState(false);

  const refreshLiveBuild = async () => {
    setLiveLoading(true);
    try {
      const info = await fetchLatestBuildInfo();
      setLiveBuild(info);
    } finally {
      setLiveLoading(false);
    }
  };

  // Fetch authoritative deployed version on mount
  useEffect(() => { void refreshLiveBuild(); }, []);

  // Load persisted state
  useEffect(() => {
    try {
      setLastPublished(localStorage.getItem(LS_LAST_PUBLISHED));
      setDismissedFor(localStorage.getItem(LS_DISMISSED_VERSION));
      setCollapsed(localStorage.getItem(LS_COLLAPSED) === '1');
    } catch {/* ignore */}
  }, []);

  // Compare running build vs LIVE deployment registry (authoritative).
  // True when the running build is newer than what's marked deployed.
  const liveOutOfDate = useMemo(() => {
    const running = getRunningBuildTime();
    if (!running) return false;
    if (!liveBuild?.buildTime) return true; // never recorded → out of date
    return isNewerBuild(running, liveBuild.buildTime);
  }, [liveBuild]);

  // True if current build hasn't been marked published in localStorage either
  const localUnpublished = useMemo(() => {
    if (!lastPublished) return true;
    try {
      const pub = new Date(lastPublished).getTime();
      const build = new Date(buildId).getTime();
      if (!isNaN(pub) && !isNaN(build)) return pub < build;
    } catch {/* fall through */}
    return true;
  }, [lastPublished, buildId]);

  // Final verdict: live registry is authoritative when available, otherwise fall back
  const hasUnpublishedChanges = liveBuild ? liveOutOfDate : localUnpublished;

  const dismissed = dismissedFor === buildId;

  const markPublished = () => {
    const now = new Date().toISOString();
    try {
      localStorage.setItem(LS_LAST_PUBLISHED, now);
      localStorage.setItem(LS_DISMISSED_VERSION, buildId);
    } catch {/* ignore */}
    setLastPublished(now);
    setDismissedFor(buildId);
  };

  const handleMarkDeployedOnServer = async () => {
    if (!isAdmin) {
      toast.error('Admin access required to record deployment');
      return;
    }
    setRecording(true);
    try {
      const ok = await recordDeployment({ notes: 'Marked from PublishChecklist' });
      if (!ok) {
        toast.error('Failed to record deployment');
        return;
      }
      toast.success('Deployment recorded — all clients will detect the new version');
      markPublished();
      await refreshLiveBuild();
    } finally {
      setRecording(false);
    }
  };

  const handlePublishedAndRefresh = async () => {
    markPublished();
    toast.info('Clearing caches and reloading…', { duration: 2000 });
    // Tiny delay so the toast can paint before we navigate away
    setTimeout(() => { void cacheBustAndReload(); }, 400);
  };

  const dismiss = () => {
    try { localStorage.setItem(LS_DISMISSED_VERSION, buildId); } catch {/* ignore */}
    setDismissedFor(buildId);
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(LS_COLLAPSED, next ? '1' : '0'); } catch {/* ignore */}
  };

  const toggleStep = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const steps: ChecklistStep[] = [
    {
      id: 'fe-review',
      title: 'Review UI changes in Preview',
      description: 'Open the live preview and verify your latest UI/component edits look correct.',
      icon: Layout,
      category: 'frontend',
      done: !!checked['fe-review'],
    },
    {
      id: 'fe-publish',
      title: 'Click Publish → Update',
      description: 'Frontend changes do NOT auto-deploy. You must click Publish (top-right) → Update to push UI changes live.',
      icon: Rocket,
      category: 'frontend',
      done: !!checked['fe-publish'],
    },
    {
      id: 'fe-verify',
      title: 'Verify on live site (hard refresh)',
      description: 'Open promptseonest.com and hard-refresh (Ctrl+Shift+R / Cmd+Shift+R) to bypass cache.',
      icon: Globe,
      category: 'frontend',
      done: !!checked['fe-verify'],
    },
    {
      id: 'be-edge',
      title: 'Edge functions auto-deploy',
      description: 'Backend edge functions deploy automatically when saved — no manual publish needed.',
      icon: Server,
      category: 'backend',
      done: !!checked['be-edge'],
    },
    {
      id: 'be-migrations',
      title: 'Database migrations auto-apply',
      description: 'Schema changes apply immediately to the live database — no publish required.',
      icon: Server,
      category: 'backend',
      done: !!checked['be-migrations'],
    },
  ];

  const frontendSteps = steps.filter((s) => s.category === 'frontend');
  const backendSteps = steps.filter((s) => s.category === 'backend');
  const completedCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  // Hide entirely if dismissed for this build AND user marked it published
  if (dismissed && !hasUnpublishedChanges) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-xl border p-4 sm:p-5',
        hasUnpublishedChanges
          ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-background'
          : 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-background'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={cn(
              'p-2.5 rounded-xl shrink-0',
              hasUnpublishedChanges ? 'bg-amber-500/20' : 'bg-emerald-500/20'
            )}
          >
            {hasUnpublishedChanges ? (
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-semibold text-base sm:text-lg">
                {hasUnpublishedChanges ? 'Unpublished UI changes detected' : 'All changes published'}
              </h3>
              <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {completedCount}/{totalCount} steps
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Last published: <span className="font-medium">{formatRelative(lastPublished)}</span>
              {' · '}
              Frontend changes need a manual <span className="font-semibold">Publish → Update</span> to go live.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" onClick={toggleCollapsed} aria-label={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          {!hasUnpublishedChanges && (
            <Button variant="ghost" size="icon" onClick={dismiss} aria-label="Dismiss">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            hasUnpublishedChanges ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {hasUnpublishedChanges && (
              <Alert className="mt-4 border-amber-500/30 bg-amber-500/5">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-xs sm:text-sm">
                  Your UI changes are <strong>only visible in Preview</strong>. Visitors on{' '}
                  <code className="px-1 py-0.5 rounded bg-muted text-[11px]">promptseonest.com</code> still see
                  the previously published version. Click <strong>Publish → Update</strong> to push them live.
                </AlertDescription>
              </Alert>
            )}

            {/* Frontend section */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Layout className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold">Frontend (UI / Pages)</h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium">
                  Manual publish required
                </span>
              </div>
              <ul className="space-y-2">
                {frontendSteps.map((step) => (
                  <ChecklistItem key={step.id} step={step} onToggle={() => toggleStep(step.id)} />
                ))}
              </ul>
            </div>

            {/* Backend section */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Server className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold">Backend (Edge Functions / DB)</h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-medium">
                  Auto-deploys
                </span>
              </div>
              <ul className="space-y-2">
                {backendSteps.map((step) => (
                  <ChecklistItem key={step.id} step={step} onToggle={() => toggleStep(step.id)} />
                ))}
              </ul>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handlePublishedAndRefresh}
                className={cn(
                  'gap-2 flex-1',
                  hasUnpublishedChanges
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white'
                )}
              >
                <Rocket className="h-4 w-4" />
                {hasUnpublishedChanges ? "I've published — clear cache & reload" : 'Clear cache & reload'}
              </Button>
              <Button
                variant="ghost"
                onClick={markPublished}
                className="gap-2"
                title="Mark as published without reloading"
              >
                Mark only
              </Button>
              <Button
                variant="outline"
                asChild
                className="gap-2"
              >
                <a href="https://promptseonest.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open live site
                </a>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ChecklistItem({ step, onToggle }: { step: ChecklistStep; onToggle: () => void }) {
  const Icon = step.icon;
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full text-left flex items-start gap-3 p-2.5 rounded-lg border transition-colors',
          step.done
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-border/60 bg-background/40 hover:bg-muted/30'
        )}
      >
        <div className="shrink-0 mt-0.5">
          {step.done ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className={cn('text-sm font-medium', step.done && 'line-through text-muted-foreground')}>
              {step.title}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
        </div>
      </button>
    </li>
  );
}
