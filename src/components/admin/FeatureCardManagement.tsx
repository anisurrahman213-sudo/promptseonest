import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  useAdminFeatureCards, 
  useUpdateFeatureCard, 
  useUploadFeatureImage,
  useDeleteFeatureImage 
} from '@/hooks/useFeatureCards';
import { 
  Sparkles, 
  Tags, 
  Image as ImageIcon, 
  Download, 
  Zap, 
  Shield,
  Upload,
  Trash2,
  Save,
  Loader2
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Tags,
  Image: ImageIcon,
  Download,
  Zap,
  Shield,
};

export function FeatureCardManagement() {
  const { data: cards, isLoading } = useAdminFeatureCards();
  const updateCard = useUpdateFeatureCard();
  const uploadImage = useUploadFeatureImage();
  const deleteImage = useDeleteFeatureImage();
  
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ title: string; description: string }>({ 
    title: '', 
    description: '' 
  });
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleEdit = (card: { id: string; title: string; description: string }) => {
    setEditingCard(card.id);
    setEditData({ title: card.title, description: card.description });
  };

  const handleSave = (cardId: string) => {
    updateCard.mutate({ id: cardId, updates: editData });
    setEditingCard(null);
  };

  const handleImageUpload = (cardId: string, file: File) => {
    uploadImage.mutate({ cardId, file });
  };

  const handleImageDelete = (cardId: string) => {
    deleteImage.mutate(cardId);
  };

  const handleToggleActive = (cardId: string, isActive: boolean) => {
    updateCard.mutate({ id: cardId, updates: { is_active: isActive } });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Feature Cards Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards?.map((card) => {
            const IconComponent = iconMap[card.icon_name] || Sparkles;
            const isEditing = editingCard === card.id;
            
            return (
              <Card key={card.id} className="relative overflow-hidden">
                {/* Image Section */}
                <div className="relative aspect-video bg-muted">
                  {card.image_url ? (
                    <>
                      <img 
                        src={card.image_url} 
                        alt={card.title}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => handleImageDelete(card.id)}
                        disabled={deleteImage.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                      <IconComponent className="h-10 w-10" />
                      <span className="text-sm">No image</span>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <input
                    type="file"
                    ref={(el) => { fileInputRefs.current[card.id] = el; }}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(card.id, file);
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => fileInputRefs.current[card.id]?.click()}
                    disabled={uploadImage.isPending}
                  >
                    {uploadImage.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>

                <CardContent className="p-4 space-y-4">
                  {/* Title & Description */}
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`title-${card.id}`}>Title</Label>
                        <Input
                          id={`title-${card.id}`}
                          value={editData.title}
                          onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`desc-${card.id}`}>Description</Label>
                        <Textarea
                          id={`desc-${card.id}`}
                          value={editData.description}
                          onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleSave(card.id)}
                          disabled={updateCard.isPending}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingCard(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h4 className="font-semibold">{card.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{card.description}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(card)}
                      >
                        Edit Text
                      </Button>
                    </>
                  )}

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Label htmlFor={`active-${card.id}`} className="text-sm">
                      Active
                    </Label>
                    <Switch
                      id={`active-${card.id}`}
                      checked={card.is_active}
                      onCheckedChange={(checked) => handleToggleActive(card.id, checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
