import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ImageIcon, Video, Calendar, Hash, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface UserGenerationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { user_id: string; email?: string; full_name?: string } | null;
}

interface Generation {
  id: string;
  image_name: string;
  image_url: string;
  title: string;
  description: string;
  tags: string;
  created_at: string;
  media_type: string;
  category?: string;
}

export function UserGenerationsDialog({ open, onOpenChange, user }: UserGenerationsDialogProps) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Generation | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    const fetchGenerations = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load generations');
        setGenerations([]);
      } else {
        setGenerations((data || []) as Generation[]);
      }
      setLoading(false);
    };
    fetchGenerations();
  }, [open, user]);

  const imageCount = generations.filter(g => g.media_type === 'image').length;
  const videoCount = generations.filter(g => g.media_type === 'video').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            All Generations — {user?.full_name || user?.email || 'User'}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-3 flex-wrap">
            <span className="text-xs">{user?.email}</span>
            {!loading && generations.length > 0 && (
              <>
                <Badge variant="secondary" className="gap-1"><Hash className="h-3 w-3" />{generations.length} total</Badge>
                {imageCount > 0 && <Badge variant="outline" className="gap-1"><ImageIcon className="h-3 w-3" />{imageCount} images</Badge>}
                {videoCount > 0 && <Badge variant="outline" className="gap-1"><Video className="h-3 w-3" />{videoCount} videos</Badge>}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : generations.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No generations found for this user</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {generations.map((gen) => (
                <div
                  key={gen.id}
                  className="group relative rounded-lg overflow-hidden border border-border bg-muted/30 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => setSelected(gen)}
                >
                  <div className="aspect-square bg-muted">
                    {gen.media_type === 'video' ? (
                      <video src={gen.image_url} className="w-full h-full object-cover" muted preload="metadata" />
                    ) : (
                      <img src={gen.image_url} alt={gen.title} className="w-full h-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="absolute top-1.5 right-1.5">
                    <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0 h-5 bg-background/80 backdrop-blur">
                      {gen.media_type === 'video' ? <Video className="h-2.5 w-2.5" /> : <ImageIcon className="h-2.5 w-2.5" />}
                    </Badge>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-medium truncate">{gen.title || gen.image_name}</p>
                    <p className="text-white/70 text-[10px] flex items-center gap-1 mt-0.5">
                      <Calendar className="h-2.5 w-2.5" />
                      {format(new Date(gen.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>

      {/* Detail preview - sibling dialog to avoid nesting issues */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="truncate">{selected.title || selected.image_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="rounded-lg overflow-hidden bg-muted max-h-[50vh] flex items-center justify-center">
                  {selected.media_type === 'video' ? (
                    <video src={selected.image_url} controls className="max-w-full max-h-[50vh]" />
                  ) : (
                    <img src={selected.image_url} alt={selected.title} className="max-w-full max-h-[50vh] object-contain" />
                  )}
                </div>
                <div className="grid gap-2 text-sm">
                  <div><span className="font-semibold">File:</span> <span className="text-muted-foreground">{selected.image_name}</span></div>
                  {selected.description && <div><span className="font-semibold">Description:</span> <span className="text-muted-foreground">{selected.description}</span></div>}
                  {selected.tags && <div><span className="font-semibold">Tags:</span> <span className="text-muted-foreground text-xs">{selected.tags}</span></div>}
                  <div><span className="font-semibold">Created:</span> <span className="text-muted-foreground">{format(new Date(selected.created_at), 'PPpp')}</span></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href={selected.image_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-1" />Open</a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={selected.image_url} download={selected.image_name}><Download className="h-4 w-4 mr-1" />Download</a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
