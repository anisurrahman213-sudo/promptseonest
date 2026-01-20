import { ImagePlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onUploadClick?: () => void;
}

export function EmptyState({ onUploadClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-primary blur-2xl opacity-20 rounded-full" />
        <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20">
          <ImagePlus className="h-10 w-10 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary shadow-lg">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>
      
      <h3 className="font-display font-bold text-xl mb-2">
        No generations yet
      </h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        Upload your first image to generate AI-powered prompts, titles, descriptions, and tags.
      </p>
      
      {onUploadClick && (
        <Button 
          onClick={onUploadClick}
          className="bg-gradient-primary hover:opacity-90"
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          Upload Your First Image
        </Button>
      )}
    </div>
  );
}
