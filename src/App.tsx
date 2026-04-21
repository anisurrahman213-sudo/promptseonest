import { lazy, Suspense } from "react";
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

// Lazy load all routes including Index for fastest initial bundle
const Index = lazy(() => import("./pages/Index"));

// Lazy load global components that aren't needed for initial render
const BackgroundProcessingIndicator = lazy(() => import("@/components/BackgroundProcessingIndicator").then(m => ({ default: m.BackgroundProcessingIndicator })));
const NetworkStatusIndicator = lazy(() => import("@/components/NetworkStatusIndicator").then(m => ({ default: m.NetworkStatusIndicator })));
const PWAInstallPrompt = lazy(() => import("@/components/PWAInstallPrompt").then(m => ({ default: m.PWAInstallPrompt })));
const AiAskPopup = lazy(() => import("@/components/AiAskPopup").then(m => ({ default: m.AiAskPopup })));

// Lazy load non-critical routes to reduce initial bundle size
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Pricing = lazy(() => import("./pages/Pricing"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const PaymentHistory = lazy(() => import("./pages/PaymentHistory"));
const AdminPayments = lazy(() => import("./pages/AdminPayments"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Tutorials = lazy(() => import("./pages/Tutorials"));
const AdobeStockGenerator = lazy(() => import("./pages/AdobeStockGenerator"));
const MetadataFixer = lazy(() => import("./pages/MetadataFixer"));
const ExtensionDownload = lazy(() => import("./pages/ExtensionDownload"));
const KeywordResearch = lazy(() => import("./pages/KeywordResearch"));
const PlatformConverter = lazy(() => import("./pages/PlatformConverter"));
const RejectionAnalyzer = lazy(() => import("./pages/RejectionAnalyzer"));
const SubmissionTracker = lazy(() => import("./pages/SubmissionTracker"));
const TrendingKeywords = lazy(() => import("./pages/TrendingKeywords"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
