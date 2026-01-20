import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { MediaUploader, MediaFile } from '@/components/MediaUploader';
import { GenerationCard } from '@/components/GenerationCard';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { SearchFilter, SortOption } from '@/components/dashboard/SearchFilter';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { BulkProgress, ProcessingFile } from '@/components/dashboard/BulkProgress';
import { AdvancedMetadataControls, MetadataSettings, defaultMetadataSettings } from '@/components/dashboard/AdvancedMetadataControls';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { useGenerations } from '@/hooks/useGenerations';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, History, Download, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { credits, refreshCredits } = useCredits();
  const { generations, addGeneration, deleteGeneration, refreshGenerations } = useGenerations();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('upload');
  const [metadataSettings, setMetadataSettings] = useState<MetadataSettings>(defaultMetadataSettings);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Calculate today's generations
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
    if (credits !== null && credits < mediaFiles.length) {
      toast.error(`Not enough credits. You need ${mediaFiles.length} credits but have ${credits}.`);
      return;
    }

    // Initialize processing files state
    const initialFiles: ProcessingFile[] = mediaFiles.map(mf => ({
      name: mf.file.name,
      status: 'pending'
    }));
    setProcessingFiles(initialFiles);
    setCurrentProcessingIndex(0);
    setIsProcessing(true);
    let successCount = 0;

    for (let i = 0; i < mediaFiles.length; i++) {
      const mediaFile = mediaFiles[i];
      const file = mediaFile.file;
      
      // Update current file to processing
      setCurrentProcessingIndex(i);
      setProcessingFiles(prev => prev.map((pf, idx) => 
        idx === i ? { ...pf, status: 'processing' } : pf
      ));

      try {
        let base64: string;
        
        if (mediaFile.type === 'video') {
          base64 = await extractVideoFrame(file);
        } else {
          base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const base64Data = result.split(',')[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }

        // Upload media to storage
        const bucketName = mediaFile.type === 'video' ? 'videos' : 'images';
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          setProcessingFiles(prev => prev.map((pf, idx) => 
            idx === i ? { ...pf, status: 'error', errorMessage: 'Upload failed' } : pf
          ));
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        // Call edge function to analyze media with settings
        const { data, error } = await supabase.functions.invoke('analyze-image', {
          body: { 
            imageBase64: base64,
            imageName: file.name,
            mediaType: mediaFile.type,
            settings: metadataSettings
          }
        });

        if (error) {
          console.error('Analysis error:', error);
          setProcessingFiles(prev => prev.map((pf, idx) => 
            idx === i ? { ...pf, status: 'error', errorMessage: 'Analysis failed' } : pf
          ));
          continue;
        }

        if (data.error) {
          setProcessingFiles(prev => prev.map((pf, idx) => 
            idx === i ? { ...pf, status: 'error', errorMessage: data.error } : pf
          ));
          continue;
        }

        // Deduct credit
        const { data: creditResult } = await supabase.rpc('deduct_credit', {
          p_user_id: user.id
        });

        if (!creditResult) {
          setProcessingFiles(prev => prev.map((pf, idx) => 
            idx === i ? { ...pf, status: 'error', errorMessage: 'Credit deduction failed' } : pf
          ));
          continue;
        }

        // Save generation to database
        const generationData = {
          user_id: user.id,
          image_name: data.data.imageName,
          image_url: publicUrl,
          prompt: data.data.prompt,
          title: data.data.title,
          description: data.data.description,
          tags: data.data.tags
        };

        const { data: savedGen, error: saveError } = await supabase
          .from('generations')
          .insert(generationData)
          .select()
          .single();

        if (saveError) {
          console.error('Save error:', saveError);
          setProcessingFiles(prev => prev.map((pf, idx) => 
            idx === i ? { ...pf, status: 'error', errorMessage: 'Save failed' } : pf
          ));
          continue;
        }

        // Mark as success
        setProcessingFiles(prev => prev.map((pf, idx) => 
          idx === i ? { ...pf, status: 'success' } : pf
        ));
        
        addGeneration(savedGen);
        successCount++;
        refreshCredits();
      } catch (error) {
        console.error('Processing error:', error);
        setProcessingFiles(prev => prev.map((pf, idx) => 
          idx === i ? { ...pf, status: 'error', errorMessage: 'Processing error' } : pf
        ));
      }
    }

    setIsProcessing(false);
    
    if (successCount > 0) {
      toast.success(`Successfully processed ${successCount} file${successCount > 1 ? 's' : ''}`);
      // Clear processing files after a delay and switch to history
      setTimeout(() => {
        setProcessingFiles([]);
        setActiveTab('history');
      }, 2000);
    } else {
      // Clear on complete failure after showing results
      setTimeout(() => setProcessingFiles([]), 3000);
    }
  };

  // Helper function to extract a frame from video
  const extractVideoFrame = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      video.onloadeddata = () => {
        // Seek to 1 second or 10% of the video, whichever is smaller
        video.currentTime = Math.min(1, video.duration * 0.1);
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        
        URL.revokeObjectURL(video.src);
        resolve(base64);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const handleDelete = async (id: string) => {
    const success = await deleteGeneration(id);
    if (success) {
      toast.success('Generation deleted');
    } else {
      toast.error('Failed to delete generation');
    }
  };

  const exportToCSV = () => {
    if (filteredGenerations.length === 0) {
      toast.error('No generations to export');
      return;
    }

    const headers = ['Image Name', 'Prompt', 'Title', 'Description', 'Tags', 'Created At'];
    const rows = filteredGenerations.map(g => [
      `"${g.image_name.replace(/"/g, '""')}"`,
      `"${g.prompt.replace(/"/g, '""')}"`,
      `"${g.title.replace(/"/g, '""')}"`,
      `"${g.description.replace(/"/g, '""')}"`,
      `"${g.tags.replace(/"/g, '""')}"`,
      `"${new Date(g.created_at).toISOString()}"`,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptnest-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('CSV exported successfully');
  };

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

          {/* Stats Cards */}
          <StatsCards 
            totalGenerations={generations.length}
            credits={credits}
            todayGenerations={todayGenerations}
          />

          {/* Bulk Progress */}
          <AnimatePresence>
            {(isProcessing || processingFiles.length > 0) && (
              <BulkProgress
                files={processingFiles}
                currentIndex={currentProcessingIndex}
                isProcessing={isProcessing}
              />
            )}
          </AnimatePresence>

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
                  <span>History ({generations.length})</span>
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
                  {generations.length > 0 && (
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
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                          variant="outline" 
                          onClick={exportToCSV}
                          className="w-full sm:w-auto shrink-0 h-10 touch-manipulation text-sm"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export CSV
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                  
                  {generations.length === 0 ? (
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
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ staggerChildren: 0.05 }}
                    >
                      <AnimatePresence>
                        {filteredGenerations.map((generation) => (
                          <GenerationCard
                            key={generation.id}
                            generation={generation}
                            onDelete={handleDelete}
                          />
                        ))}
                      </AnimatePresence>
                    </motion.div>
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
