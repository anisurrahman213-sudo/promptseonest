import { lazy, Suspense, ComponentType } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { BackgroundProcessorProvider } from "@/contexts/BackgroundProcessorContext";
import { RouteTracker } from "@/components/RouteTracker";

// Auto-recover from stale chunk errors (after deploys / HMR cache miss)
const RELOAD_KEY = "__chunk_reload__";
function lazyWithRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem(RELOAD_KEY);
      return mod;
    } catch (err: any) {
      const msg = String(err?.message || err);
      const isChunkErr = /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(msg);
      const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === "1";
      if (isChunkErr && !alreadyReloaded) {
        sessionStorage.setItem(RELOAD_KEY, "1");
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}

// Lazy load all routes including Index for fastest initial bundle
const Index = lazyWithRetry(() => import("./pages/Index"));

// Lazy load global components that aren't needed for initial render
const BackgroundProcessingIndicator = lazyWithRetry(() => import("@/components/BackgroundProcessingIndicator").then(m => ({ default: m.BackgroundProcessingIndicator })));
const NetworkStatusIndicator = lazyWithRetry(() => import("@/components/NetworkStatusIndicator").then(m => ({ default: m.NetworkStatusIndicator })));
const PWAInstallPrompt = lazyWithRetry(() => import("@/components/PWAInstallPrompt").then(m => ({ default: m.PWAInstallPrompt })));
const AiAskPopup = lazyWithRetry(() => import("@/components/AiAskPopup").then(m => ({ default: m.AiAskPopup })));

// Lazy load non-critical routes to reduce initial bundle size
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const Pricing = lazyWithRetry(() => import("./pages/Pricing"));
const CalendarPage = lazyWithRetry(() => import("./pages/CalendarPage"));
const PaymentHistory = lazyWithRetry(() => import("./pages/PaymentHistory"));
const AdminPayments = lazyWithRetry(() => import("./pages/AdminPayments"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const Tutorials = lazyWithRetry(() => import("./pages/Tutorials"));
const AdobeStockGenerator = lazyWithRetry(() => import("./pages/AdobeStockGenerator"));
const MetadataFixer = lazyWithRetry(() => import("./pages/MetadataFixer"));
const ExtensionDownload = lazyWithRetry(() => import("./pages/ExtensionDownload"));
const KeywordResearch = lazyWithRetry(() => import("./pages/KeywordResearch"));
const PlatformConverter = lazyWithRetry(() => import("./pages/PlatformConverter"));
const RejectionAnalyzer = lazyWithRetry(() => import("./pages/RejectionAnalyzer"));
const SubmissionTracker = lazyWithRetry(() => import("./pages/SubmissionTracker"));
const TrendingKeywords = lazyWithRetry(() => import("./pages/TrendingKeywords"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Aggressive caching for maximum speed
      staleTime: 1000 * 60 * 10, // 10 minutes - serve cached instantly
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      refetchOnWindowFocus: false, // Don't refetch when tab regains focus
      refetchOnReconnect: 'always',
      refetchOnMount: false, // Use cache if available
      retry: (failureCount, error: any) => {
        if (!navigator.onLine) return false;
        return failureCount < 2; // Reduced retries for faster failure
      },
    },
  },
});

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <BackgroundProcessorProvider>
          <TooltipProvider>
            <Suspense fallback={null}>
              <NetworkStatusIndicator />
              <PWAInstallPrompt />
              <BackgroundProcessingIndicator />
              <AiAskPopup />
            </Suspense>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <RouteTracker />
              <Suspense fallback={<div className="min-h-screen bg-background" />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/payment-history" element={<PaymentHistory />} />
                  <Route path="/admin/payments" element={<AdminPayments />} />
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/tutorials" element={<Tutorials />} />
                  <Route path="/adobe-stock-generator" element={<AdobeStockGenerator />} />
                  <Route path="/metadata-fixer" element={<MetadataFixer />} />
                  <Route path="/extension" element={<ExtensionDownload />} />
                  <Route path="/keyword-research" element={<KeywordResearch />} />
                  <Route path="/platform-converter" element={<PlatformConverter />} />
                  <Route path="/rejection-analyzer" element={<RejectionAnalyzer />} />
                  <Route path="/submission-tracker" element={<SubmissionTracker />} />
                  <Route path="/trending-keywords" element={<TrendingKeywords />} />
                  <Route path="/admin/health" element={<AdminDashboard />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </BackgroundProcessorProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
