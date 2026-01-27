import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { MediaUploader, MediaFile } from '@/components/MediaUploader';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { UpgradeBanner } from '@/components/dashboard/UpgradeBanner';
import { SearchFilter, SortOption } from '@/components/dashboard/SearchFilter';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { AdvancedMetadataControls, MetadataSettings, defaultMetadataSettings } from '@/components/dashboard/AdvancedMetadataControls';
import { ExportDialog } from '@/components/dashboard/ExportDialog';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { AutoDeleteWarning } from '@/components/dashboard/AutoDeleteWarning';
import { PullToRefresh } from '@/components/dashboard/PullToRefresh';
import { VirtualGenerationList } from '@/components/dashboard/VirtualGenerationList';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { useInfiniteGenerations } from '@/hooks/useInfiniteGenerations';
import { useBackgroundProcessor } from '@/contexts/BackgroundProcessorContext';
import { Loader2, Sparkles, History, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
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
    loading: generationsLoading 
  } = useInfiniteGenerations({ pageSize: 12 });
  const { startProcessing, isProcessing } = useBackgroundProcessor();
  const [activeTab, setActiveTab] = useState('upload');
  const [metadataSettings, setMetadataSettings] = useState<MetadataSettings>(defaultMetadataSettings);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

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
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleUpload = async (mediaFiles: MediaFile[]) => {
    if (!user) return;
    
    if (credits !== null && credits < mediaFiles.length) {
      toast.error(`Not enough credits. You need ${mediaFiles.length} credits but have ${credits}.`);
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

  // Video frame extraction now handled by videoFrameExtractor.ts

  const handleDelete = async (id: string) => {
    const success = await deleteGeneration(id);
    if (success) {
      toast.success('Generation deleted');
    } else {
      toast.error('Failed to delete generation');
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    const result = await deleteMultipleGenerations(ids);
    if (result.success > 0) {
      toast.success(`${result.success} generation${result.success > 1 ? 's' : ''} deleted`);
    }
    if (result.failed > 0) {
      toast.error(`Failed to delete ${result.failed} generation${result.failed > 1 ? 's' : ''}`);
    }
    return result;
  };

  // exportToCSV removed - now using ExportDialog component

  return (
    <motion.div 
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
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
                Generate Stock Metadata
              </motion.span>
            </h1>
            <motion.p 
              className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto px-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Upload images or videos to generate unique, platform-optimized metadata for Adobe Stock, Shutterstock, Freepik & AI marketplaces
            </motion.p>
          </motion.div>

          {/* Auto-Delete Warning - Important for users */}
          <AutoDeleteWarning generations={generations} />

          {/* Upgrade Banner */}
          <UpgradeBanner credits={credits} />

          {/* Stats Cards */}
          <StatsCards 
            totalGenerations={totalCount}
            credits={credits}
            todayGenerations={todayGenerations}
          />

          {/* Recent Activity Feed */}
          <RecentActivity generations={generations} maxItems={5} />

          {/* Background processing indicator is now global - shown in BackgroundProcessingIndicator.tsx */}

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
                  <span>Generate</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-md sm:rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md font-medium text-xs sm:text-sm transition-all touch-manipulation"
                >
                  <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>History ({totalCount})</span>
                </TabsTrigger>
              </TabsList>
            </motion.div>

            <AnimatePresence mode="wait">
              <TabsContent value="upload" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
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
                    maxFiles={credits !== null ? Math.min(credits, 10) : 10}
                    selectedPlatform={metadataSettings.exportPlatform}
                  />
                </motion.div>
                
                <AnimatePresence>
                  {credits !== null && credits < 3 && credits > 0 && (
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
                          <p className="font-medium text-warning text-sm sm:text-base">Low credits!</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            You have {credits} credit{credits !== 1 ? 's' : ''} remaining
                          </p>
                        </div>
                      </div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                        <Button asChild className="w-full sm:w-auto bg-gradient-to-r from-warning to-orange-500 hover:opacity-90 touch-manipulation">
                          <a href="/pricing">Upgrade Now</a>
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}

                  {credits === 0 && (
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
                      <h3 className="font-display font-bold text-lg sm:text-xl mb-2">No Credits Left</h3>
                      <p className="text-muted-foreground text-sm sm:text-base mb-4">
                        You've used all your credits. Upgrade to continue generating metadata.
                      </p>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button asChild className="bg-gradient-primary hover:opacity-90 touch-manipulation">
                          <a href="/pricing">View Pricing Plans</a>
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="history" className="space-y-4 sm:space-y-5 mt-4 sm:mt-6">
                <motion.div
                  key="history-tab"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
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
                      <ExportDialog generations={filteredGenerations} />
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
                        No results found for "{searchQuery}"
                      </p>
                      <motion.div whileHover={{ scale: 1.05 }}>
                        <Button
                          variant="link"
                          onClick={() => setSearchQuery('')}
                          className="mt-2"
                        >
                          Clear search
                        </Button>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <PullToRefresh onRefresh={refreshGenerations}>
                      <VirtualGenerationList
                        generations={filteredGenerations}
                        onDelete={handleDelete}
                        onBulkDelete={handleBulkDelete}
                        hasMore={hasMore}
                        loadMore={loadMore}
                        loadingMore={loadingMore}
                      />
                    </PullToRefresh>
                  )}
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </div>
      </main>
    </motion.div>
  );
}
