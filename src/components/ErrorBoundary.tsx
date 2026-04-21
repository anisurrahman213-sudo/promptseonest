import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cacheBustAndReload } from "@/lib/cacheBust";

interface Props {
  children: ReactNode;
  /** Optional custom fallback render fn. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Global error boundary. Catches render-phase errors anywhere below it
 * and shows a friendly recovery UI instead of a blank white screen.
 *
 * Auto-recovery hints:
 *  - "Try again" — resets local state, re-renders children
 *  - "Reload" — purges all caches (SW + CacheStorage) and hard-reloads,
 *               which fixes stale Vite/SW chunks after a deploy
 *  - "Go home" — navigates to "/"
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to console for dev + Lovable runtime-error capture
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  hardReload = async () => {
    try {
      await cacheBustAndReload();
    } catch {
      window.location.reload();
    }
  };

  goHome = () => {
    window.location.href = "/";
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.reset);

    const message = error.message || "An unexpected error occurred.";
    const isChunkErr = /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|useEffect.*null|null.*useEffect/i.test(
      message + " " + (error.stack || "")
    );

    return (
      <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-lg p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="shrink-0 rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold tracking-tight">
                Something went wrong
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isChunkErr
                  ? "A new version may have been published. Reload to fetch the latest assets."
                  : "The app hit an unexpected error. You can try again or reload to recover."}
              </p>

              <details className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-xs">
                <summary className="cursor-pointer font-medium text-foreground">
                  Error details
                </summary>
                <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words text-muted-foreground">
                  {message}
                  {error.stack ? `\n\n${error.stack.split("\n").slice(0, 6).join("\n")}` : ""}
                </pre>
              </details>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button onClick={this.reset} variant="outline">
                  <RefreshCw className="h-4 w-4" /> Try again
                </Button>
                <Button onClick={this.hardReload}>
                  <RefreshCw className="h-4 w-4" /> Reload app
                </Button>
                <Button onClick={this.goHome} variant="ghost">
                  <Home className="h-4 w-4" /> Go home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
