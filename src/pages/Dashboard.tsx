import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { MediaUploader, MediaFile } from '@/components/MediaUploader';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { UpgradeBanner } from '@/components/dashboard/UpgradeBanner';
import { SearchFilter, SortOption } from '@/components/dashboard/SearchFilter';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { AdvancedMetadataControls, MetadataSettings, defaultMetadataSettings } from '@/components/dashboard/AdvancedMetadataControls';
import { AutoDeleteWarning } from '@/components/dashboard/AutoDeleteWarning';
import { PullToRefresh } from '@/components/dashboard/PullToRefresh';

// Lazy load heavy below-fold components for faster initial paint
const ExportDialog = lazy(() => import('@/components/dashboard/ExportDialog').then(m => ({ default: m.ExportDialog })));
const RecentExports = lazy(() => import('@/components/dashboard/RecentExports').then(m => ({ default: m.RecentExports })));
const RecentActivity = lazy(() => import('@/components/dashboard/RecentActivity').then(m => ({ default: m.RecentActivity })));
const VirtualGenerationList = lazy(() => import('@/components/dashboard/VirtualGenerationList').then(m => ({ default: m.VirtualGenerationList })));

import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { usePlansActive } from '@/hooks/usePlansActive';
import { useInfiniteGenerations } from '@/hooks/useInfiniteGenerations';
import { useBackgroundProcessor } from '@/contexts/BackgroundProcessorContext';
import { Loader2, Sparkles, History, Zap, CreditCard, AlertTriangle, User, Search, ShieldAlert, ListChecks, TrendingUp, ArrowRightLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: hasActivePlans } = usePlansActive();
  const { credits, refreshCredits } = useCredits();
  const { 
    generations, 
    totalCount,
    hasMore,
    loadMore,
    loadingMore,
    addGeneration, 
    deleteGeneration,
    deleteMultipleGenerations,
    refreshGenerations,
    fetchAllForExport,
     updateGeneration,
    loading: generationsLoading 
  } = useInfiniteGenerations({ pageSize: 12 });
  const { startProcessing, isProcessing } = useBackgroundProcessor();
  const [activeTab, setActiveTab] = useState('upload');
  const [metadataSettings, setMetadataSettings] = useState<MetadataSettings>(defaultMetadataSettings);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Check profile completeness
  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_profiles')
      .select('full_name, phone_number')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data && (!data.full_name || !data.phone_number)) {
          setIsProfileIncomplete(true);
        }
      });
  }, [user]);

  // Calculate today's generations (from current page data - approximation)
  const todayGenerations = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return generations.filter(g => new Date(g.created_at) >= today).length;
  }, [generations]);

  // Filter and sort generations
  const filteredGenerations = useMemo(() => {
    let filtered = generations;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(g => 
        g.image_name.toLowerCase().includes(query) ||
        g.title.toLowerCase().includes(query) ||
        g.tags.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.image_name.localeCompare(b.image_name);
        default:
          return 0;
      }
    });
  }, [generations, searchQuery, sortBy]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary blur-xl opacity-30 rounded-full" />
            <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
          </div>
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleUpload = async (mediaFiles: MediaFile[]) => {
    if (!user) return;
    
    if (hasActivePlans && credits !== null && credits < mediaFiles.length) {
      toast.error(t('errors.notEnoughCredits', { needed: mediaFiles.length, have: credits }));
      return;
    }

    // Start background processing - will continue even if user navigates away
    await startProcessing(
      mediaFiles,
      user.id,
      metadataSettings,
      addGeneration,
      refreshCredits
    );
  };

  const handleDelete = async (id: string) => {
    const success = await deleteGeneration(id);
    if (success) {
      toast.success(t('toast.generationDeleted'));
    } else {
      toast.error(t('errors.deleteFailed'));
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    const result = await deleteMultipleGenerations(ids);
    if (result.success > 0) {
      toast.success(t('toast.generationsDeleted', { count: result.success }));
    }
    if (result.failed > 0) {
      toast.error(t('errors.deleteFailed'));
    }
    return result;
  };

   const handleUpdateCategory = async (id: string, category: string) => {
     return await updateGeneration(id, { category });
   };

   const handleUpdateMetadata = async (id: string, data: Partial<typeof generations[0]>) => {
     return await updateGeneration(id, data);
   };

  return (
    <motion.div 
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <SEOHead title="Dashboard" description="Manage your AI-generated image SEO metadata. Upload images, view tags, titles and descriptions." path="/dashboard" noindex />
      <Header />
      
      <main className="container py-4 sm:py-8 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-8">
          {/* Welcome Section */}
          <motion.div 
            className="text-center space-y-2 sm:space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="font-display text-2xl sm:text-4xl font-bold">
              <motion.span 
                className="text-gradient inline-block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
              >
                {t('dashboard.title')}
              </motion.span>
            </h1>
            <motion.p 
              className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto px-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {t('dashboard.subtitle')}
            </motion.p>
          </motion.div>

          {/* Profile Incomplete Banner */}
          {isProfileIncomplete && (
            <Alert className="border-warning/30 bg-warning/5">
              <User className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm">Complete your profile to enhance your experience</span>
                <Button size="sm" variant="outline" onClick={() => navigate('/profile?setup=true')} className="gap-1.5 shrink-0">
                  Complete Profile
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Auto-Delete Warning - Important for users */}
          <AutoDeleteWarning generations={generations} />

          {/* Credit & Payment Widget */}
          {hasActivePlans && credits !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-muted/50 border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/15">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Credits: {credits} remaining</p>
                  <p className="text-xs text-muted-foreground">Manage your subscription and payment history</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate('/payment-history')} className="gap-1.5">
                  <History className="h-3.5 w-3.5" /> Payment History
                </Button>
                {credits < 50 && (
                  <Button size="sm" onClick={() => navigate('/pricing')} className="gap-1.5 bg-gradient-primary hover:opacity-90">
                    <Zap className="h-3.5 w-3.5" /> Upgrade
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* Stats Cards */}
          <StatsCards 
            totalGenerations={totalCount}
            credits={hasActivePlans ? credits : null}
            todayGenerations={todayGenerations}
          />

          {/* Stock Contributor Tools */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            aria-label="Stock contributor tools"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Stock Contributor Tools</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { icon: ShieldAlert, title: 'Rejection Analyzer', desc: 'Find out why your submissions were rejected', path: '/rejection-analyzer', color: 'text-destructive', bg: 'bg-destructive/10' },
                { icon: ListChecks, title: 'Submission Tracker', desc: 'Track your stock platform submissions', path: '/submission-tracker', color: 'text-primary', bg: 'bg-primary/10' },
                { icon: TrendingUp, title: 'Trending Keywords', desc: 'Discover hot keywords across platforms', path: '/trending-keywords', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { icon: Search, title: 'Keyword Research', desc: 'Research high-value keywords by subject', path: '/keyword-research', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { icon: ArrowRightLeft, title: 'Platform Converter', desc: 'Convert metadata across stock platforms', path: '/platform-converter', color: 'text-purple-500', bg: 'bg-purple-500/10' },
              ].map((tool) => (
                <button
                  key={tool.path}
                  onClick={() => navigate(tool.path)}
                  className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all text-left"
                >
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", tool.bg)}>
                    <tool.icon className={cn("h-5 w-5", tool.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{tool.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{tool.desc}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </motion.section>

          {/* Recent Activity Feed */}
          <Suspense fallback={<Skeleton className="h-32 w-full rounded-xl" />}>
            <RecentActivity generations={generations} maxItems={5} />
          </Suspense>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <TabsList className="grid w-full grid-cols-2 h-12 sm:h-14 p-1 sm:p-1.5 bg-muted/50 rounded-lg sm:rounded-xl">
                <TabsTrigger 
                  value="upload" 
                  className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-md sm:rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md font-medium text-xs sm:text-sm transition-all touch-manipulation"
                >
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{t('dashboard.generateTab')}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-md sm:rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md font-medium text-xs sm:text-sm transition-all touch-manipulation"
                >
                  <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{t('dashboard.historyTab')} ({totalCount})</span>
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <AnimatePresence mode="wait">
              {activeTab === 'upload' && (
                <TabsContent value="upload" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6" forceMount>
                  {/* Advanced Metadata Controls */}
                  <AdvancedMetadataControls 
                    settings={metadataSettings}
                    onSettingsChange={setMetadataSettings}
                  />

                  <motion.div
                    key="upload-tab"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <MediaUploader 
                      onUpload={handleUpload} 
                      isProcessing={isProcessing}
                      maxFiles={hasActivePlans && credits !== null ? Math.min(credits, 500) : 500}
                      selectedPlatform={metadataSettings.exportPlatform}
                    />
                  </motion.div>
                  
                  <AnimatePresence>
                    {hasActivePlans && credits !== null && credits < 3 && credits > 0 && (
                      <motion.div 
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-warning/10 to-orange-500/10 border border-warning/20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      >
                        <div className="flex items-center gap-3">
                          <motion.div 
                            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-warning/20 shrink-0"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          >
                            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
                          </motion.div>
                          <div>
                            <p className="font-medium text-warning text-sm sm:text-base">{t('dashboard.lowCredits')}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {t('dashboard.creditsRemainingCount', { count: credits })}
                            </p>
                          </div>
                        </div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                          <Button asChild className="w-full sm:w-auto bg-gradient-to-r from-warning to-orange-500 hover:opacity-90 touch-manipulation">
                            <a href="/pricing">{t('dashboard.upgradeNow')}</a>
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}

                    {hasActivePlans && credits === 0 && (
                      <motion.div 
                        className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-r from-destructive/10 to-red-500/10 border border-destructive/20 text-center"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        >
                          <Zap className="h-10 w-10 sm:h-12 sm:w-12 text-destructive mb-3 sm:mb-4" />
                        </motion.div>
                        <h3 className="font-display font-bold text-lg sm:text-xl mb-2">{t('dashboard.noCreditsLeft')}</h3>
                        <p className="text-muted-foreground text-sm sm:text-base mb-4">
                          {t('dashboard.noCreditsDesc')}
                        </p>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button asChild className="bg-gradient-primary hover:opacity-90 touch-manipulation">
                            <a href="/pricing">{t('dashboard.viewPricingPlans')}</a>
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </TabsContent>
              )}

              {activeTab === 'history' && (
                <TabsContent value="history" className="space-y-4 sm:space-y-5 mt-4 sm:mt-6" forceMount>
                  <motion.div
                    key="history-tab"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <Suspense fallback={<Skeleton className="h-20 w-full rounded-xl" />}>
                      <RecentExports />
                    </Suspense>
                    {totalCount > 0 && (
                      <motion.div 
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <div className="flex-1">
                          <SearchFilter
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            sortBy={sortBy}
                            onSortChange={setSortBy}
                          />
                        </div>
                        <Suspense fallback={<Skeleton className="h-10 w-32 rounded-md" />}>
                          <ExportDialog 
                            generations={filteredGenerations} 
                            fetchAllForExport={fetchAllForExport}
                            searchQuery={searchQuery}
                            exportOptions={{
                              overrideCategory: metadataSettings.category,
                              editorialStatus: metadataSettings.editorialStatus,
                            }}
                            onUpdateMetadata={handleUpdateMetadata}
                          />
                        </Suspense>
                      </motion.div>
                    )}
                    
                    {generationsLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {[...Array(6)].map((_, i) => (
                          <Skeleton key={i} className="aspect-[4/5] w-full rounded-xl" />
                        ))}
                      </div>
                    ) : totalCount === 0 ? (
                      <EmptyState onUploadClick={() => setActiveTab('upload')} />
                    ) : filteredGenerations.length === 0 ? (
                      <motion.div 
                        className="text-center py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <p className="text-muted-foreground">
                          {t('dashboard.noResults', { query: searchQuery })}
                        </p>
                        <motion.div whileHover={{ scale: 1.05 }}>
                          <Button
                            variant="link"
                            onClick={() => setSearchQuery('')}
                            className="mt-2"
                          >
                            {t('dashboard.clearSearch')}
                          </Button>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <PullToRefresh onRefresh={refreshGenerations}>
                        <Suspense fallback={
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                            {[...Array(6)].map((_, i) => (
                              <Skeleton key={i} className="aspect-[4/5] w-full rounded-xl" />
                            ))}
                          </div>
                        }>
                          <VirtualGenerationList
                            generations={filteredGenerations}
                            onDelete={handleDelete}
                            onBulkDelete={handleBulkDelete}
                             onUpdateCategory={handleUpdateCategory}
                            onUpdateMetadata={handleUpdateMetadata}
                            hasMore={hasMore}
                            loadMore={loadMore}
                            loadingMore={loadingMore}
                          />
                        </Suspense>
                      </PullToRefresh>
                    )}
                  </motion.div>
                </TabsContent>
              )}
            </AnimatePresence>
          </Tabs>
        </div>
      </main>
    </motion.div>
  );
}
