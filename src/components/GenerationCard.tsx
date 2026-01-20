import { useState } from 'react';
import { Copy, Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Generation } from '@/hooks/useGenerations';
import { toast } from 'sonner';

interface GenerationCardProps {
  generation: Generation;
  onDelete: (id: string) => void;
}

export function GenerationCard({ generation, onDelete }: GenerationCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this generation?')) {
      onDelete(generation.id);
    }
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={() => copyToClipboard(text, field)}
    >
      {copiedField === field ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <Card className="overflow-hidden animate-fade-in border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <CardHeader className="p-5 pb-0">
        <div className="flex gap-4">
          <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-muted shadow-md">
            <img
              src={generation.image_url}
              alt={generation.image_name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex-1 min-w-0 py-1">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg truncate">
                  {generation.image_name}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-accent" />
                  {new Date(generation.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Quick preview of title when collapsed */}
            {!expanded && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {generation.title}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("p-5 space-y-4 transition-all duration-300", !expanded && "hidden")}>
        {/* Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className="bg-primary/10 text-primary border-0 text-xs font-medium">
              Prompt
            </Badge>
            <CopyButton text={generation.prompt} field="Prompt" />
          </div>
          <p className="text-sm bg-muted/50 p-4 rounded-xl leading-relaxed">{generation.prompt}</p>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className="bg-secondary/10 text-secondary border-0 text-xs font-medium">
              Title
            </Badge>
            <CopyButton text={generation.title} field="Title" />
          </div>
          <p className="text-sm bg-muted/50 p-4 rounded-xl font-medium">{generation.title}</p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className="bg-accent/10 text-accent border-0 text-xs font-medium">
              Description
            </Badge>
            <CopyButton text={generation.description} field="Description" />
          </div>
          <p className="text-sm bg-muted/50 p-4 rounded-xl leading-relaxed">{generation.description}</p>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className="bg-warning/10 text-warning border-0 text-xs font-medium">
              Tags ({generation.tags.split(',').length})
            </Badge>
            <CopyButton text={generation.tags} field="Tags" />
          </div>
          <div className="flex flex-wrap gap-2 bg-muted/50 p-4 rounded-xl">
            {generation.tags.split(',').slice(0, 15).map((tag, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs bg-background/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors cursor-default"
              >
                {tag.trim()}
              </Badge>
            ))}
            {generation.tags.split(',').length > 15 && (
              <Badge variant="outline" className="text-xs bg-muted">
                +{generation.tags.split(',').length - 15} more
              </Badge>
            )}
          </div>
        </div>

        {/* Copy All */}
        <Button
          variant="outline"
          className="w-full h-12 font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
          onClick={() => {
            const allData = `Prompt: ${generation.prompt}\n\nTitle: ${generation.title}\n\nDescription: ${generation.description}\n\nTags: ${generation.tags}`;
            copyToClipboard(allData, 'All data');
          }}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy All Metadata
        </Button>
      </CardContent>
    </Card>
  );
}
