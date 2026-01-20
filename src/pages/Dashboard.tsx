import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { ImageUploader } from '@/components/ImageUploader';
import { GenerationCard } from '@/components/GenerationCard';
import { useAuth } from '@/hooks/useAuth';
import { useCredits } from '@/hooks/useCredits';
import { useGenerations, Generation } from '@/hooks/useGenerations';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, History, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { credits, refreshCredits } = useCredits();
  const { generations, addGeneration, deleteGeneration, refreshGenerations } = useGenerations();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
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

        // Add to local state
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
    if (generations.length === 0) {
      toast.error('No generations to export');
      return;
    }

    const headers = ['Image Name', 'Prompt', 'Title', 'Description', 'Tags'];
    const rows = generations.map(g => [
      `"${g.image_name.replace(/"/g, '""')}"`,
      `"${g.prompt.replace(/"/g, '""')}"`,
      `"${g.title.replace(/"/g, '""')}"`,
      `"${g.description.replace(/"/g, '""')}"`,
      `"${g.tags.replace(/"/g, '""')}"`,
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
      
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-2">
            <h1 className="font-display text-3xl font-bold">
              Generate Image Metadata
            </h1>
            <p className="text-muted-foreground">
              Upload images to generate AI prompts, titles, descriptions, and tags
            </p>
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium">{processingStatus}</span>
            </div>
          )}

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History ({generations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <ImageUploader 
                onUpload={handleUpload} 
                isProcessing={isProcessing}
                maxFiles={credits !== null ? Math.min(credits, 10) : 10}
              />
              
              {credits !== null && credits < 3 && (
                <div className="text-center p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-sm text-warning font-medium">
                    Low credits! You have {credits} credit{credits !== 1 ? 's' : ''} remaining.
                  </p>
                  <Button variant="link" className="text-warning" asChild>
                    <a href="/pricing">Upgrade for more credits →</a>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {generations.length > 0 && (
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={exportToCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              )}
              
              {generations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-4">
                    <History className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-lg">No generations yet</h3>
                  <p className="text-muted-foreground mt-1">
                    Upload some images to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generations.map((generation) => (
                    <GenerationCard
                      key={generation.id}
                      generation={generation}
                      onDelete={handleDelete}
                    />
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
