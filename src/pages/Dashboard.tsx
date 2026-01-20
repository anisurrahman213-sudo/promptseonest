import { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { ImageUploader } from '@/components/ImageUploader';
import { GenerationCard } from '@/components/GenerationCard';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { SearchFilter, SortOption } from '@/components/dashboard/SearchFilter';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { useGenerations } from '@/hooks/useGenerations';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, History, Download, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { credits, refreshCredits } = useCredits();
  const { generations, addGeneration, deleteGeneration, refreshGenerations } = useGenerations();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  
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

  const handleUpload = async (files: File[]) => {
    if (credits !== null && credits < files.length) {
      toast.error(`Not enough credits. You need ${files.length} credits but have ${credits}.`);
      return;
    }

    setIsProcessing(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessingStatus(`Processing ${i + 1} of ${files.length}: ${file.name}`);

      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Upload image to storage
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        // Call edge function to analyze image
        const { data, error } = await supabase.functions.invoke('analyze-image', {
          body: { 
            imageBase64: base64,
            imageName: file.name
          }
        });

        if (error) {
          console.error('Analysis error:', error);
          toast.error(`Failed to analyze ${file.name}`);
          continue;
        }

        if (data.error) {
          toast.error(data.error);
          continue;
        }

        // Deduct credit
        const { data: creditResult } = await supabase.rpc('deduct_credit', {
          p_user_id: user.id
        });

        if (!creditResult) {
          toast.error('Failed to deduct credit');
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
          toast.error(`Failed to save generation for ${file.name}`);
          continue;
        }

        addGeneration(savedGen);
        successCount++;
        refreshCredits();
      } catch (error) {
        console.error('Processing error:', error);
        toast.error(`Error processing ${file.name}`);
      }
    }

    setIsProcessing(false);
    setProcessingStatus('');
    
    if (successCount > 0) {
      toast.success(`Successfully processed ${successCount} image${successCount > 1 ? 's' : ''}`);
      // Switch to history tab after successful generation
      setActiveTab('history');
    }
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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 pb-20">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-3 animate-fade-in">
            <h1 className="font-display text-4xl font-bold">
              <span className="text-gradient">Generate Image Metadata</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Upload images to generate AI-powered prompts, SEO titles, descriptions, and tags
            </p>
          </div>

          {/* Stats Cards */}
          <StatsCards 
            totalGenerations={generations.length}
            credits={credits}
            todayGenerations={todayGenerations}
          />

          {/* Processing Status */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 shadow-glow animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full" />
                <Loader2 className="h-6 w-6 animate-spin text-primary relative" />
              </div>
              <div className="text-left">
                <p className="font-medium">{processingStatus}</p>
                <p className="text-xs text-muted-foreground">Please wait while we analyze your image...</p>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-14 p-1.5 bg-muted/50 rounded-xl">
              <TabsTrigger 
                value="upload" 
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md font-medium transition-all"
              >
                <Sparkles className="h-4 w-4" />
                Generate New
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md font-medium transition-all"
              >
                <History className="h-4 w-4" />
                History ({generations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6 mt-6">
              <ImageUploader 
                onUpload={handleUpload} 
                isProcessing={isProcessing}
                maxFiles={credits !== null ? Math.min(credits, 10) : 10}
              />
              
              {credits !== null && credits < 3 && credits > 0 && (
                <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-warning/10 to-orange-500/10 border border-warning/20 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-warning/20">
                      <Zap className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium text-warning">Low credits!</p>
                      <p className="text-sm text-muted-foreground">
                        You have {credits} credit{credits !== 1 ? 's' : ''} remaining
                      </p>
                    </div>
                  </div>
                  <Button asChild className="bg-gradient-to-r from-warning to-orange-500 hover:opacity-90">
                    <a href="/pricing">Upgrade Now</a>
                  </Button>
                </div>
              )}

              {credits === 0 && (
                <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-gradient-to-r from-destructive/10 to-red-500/10 border border-destructive/20 text-center animate-fade-in">
                  <Zap className="h-12 w-12 text-destructive mb-4" />
                  <h3 className="font-display font-bold text-xl mb-2">No Credits Left</h3>
                  <p className="text-muted-foreground mb-4">
                    You've used all your credits. Upgrade to continue generating metadata.
                  </p>
                  <Button asChild className="bg-gradient-primary hover:opacity-90">
                    <a href="/pricing">View Pricing Plans</a>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-5 mt-6">
              {generations.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <SearchFilter
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={exportToCSV}
                    className="shrink-0 h-10"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              )}
              
              {generations.length === 0 ? (
                <EmptyState onUploadClick={() => setActiveTab('upload')} />
              ) : filteredGenerations.length === 0 ? (
                <div className="text-center py-12 animate-fade-in">
                  <p className="text-muted-foreground">
                    No results found for "{searchQuery}"
                  </p>
                  <Button
                    variant="link"
                    onClick={() => setSearchQuery('')}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredGenerations.map((generation, index) => (
                    <div 
                      key={generation.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <GenerationCard
                        generation={generation}
                        onDelete={handleDelete}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
