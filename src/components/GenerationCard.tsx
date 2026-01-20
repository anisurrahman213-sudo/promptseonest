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
    <Card className="overflow-hidden animate-fade-in">
      <CardHeader className="p-4 pb-0">
        <div className="flex gap-4">
          <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-muted">
            <img
              src={generation.image_url}
              alt={generation.image_name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display font-semibold truncate">
                  {generation.image_name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {new Date(generation.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
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
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("p-4 space-y-4", !expanded && "hidden")}>
        {/* Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">Prompt</Badge>
            <CopyButton text={generation.prompt} field="Prompt" />
          </div>
          <p className="text-sm bg-muted p-3 rounded-lg">{generation.prompt}</p>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">Title</Badge>
            <CopyButton text={generation.title} field="Title" />
          </div>
          <p className="text-sm bg-muted p-3 rounded-lg">{generation.title}</p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">Description</Badge>
            <CopyButton text={generation.description} field="Description" />
          </div>
          <p className="text-sm bg-muted p-3 rounded-lg">{generation.description}</p>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">Tags ({generation.tags.split(',').length})</Badge>
            <CopyButton text={generation.tags} field="Tags" />
          </div>
          <div className="flex flex-wrap gap-1.5 bg-muted p-3 rounded-lg">
            {generation.tags.split(',').map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag.trim()}
              </Badge>
            ))}
          </div>
        </div>

        {/* Copy All */}
        <Button
          variant="outline"
          className="w-full"
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
