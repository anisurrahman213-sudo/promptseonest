import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  useAdminFeatureCards, 
  useUpdateFeatureCard, 
  useUploadFeatureImage,
  useDeleteFeatureImage,
  useCreateFeatureCard,
  useDeleteFeatureCard,
  useReorderFeatureCards,
  FeatureCard
} from '@/hooks/useFeatureCards';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  Loader2,
  Video,
  Info,
  Plus,
  GripVertical
} from 'lucide-react';
import { toast } from 'sonner';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Tags,
  Image: ImageIcon,
  Download,
  Zap,
  Shield,
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];

const isVideoFile = (url: string | null): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

// Sortable Feature Card Component
interface SortableFeatureCardProps {
  card: FeatureCard;
  isEditing: boolean;
  editData: { title: string; description: string };
  setEditData: React.Dispatch<React.SetStateAction<{ title: string; description: string }>>;
  setEditingCard: React.Dispatch<React.SetStateAction<string | null>>;
  handleEdit: (card: { id: string; title: string; description: string }) => void;
  handleSave: (cardId: string) => void;
  handleMediaUpload: (cardId: string, file: File) => void;
  handleImageDelete: (cardId: string) => void;
  handleToggleActive: (cardId: string, isActive: boolean) => void;
  handleDeleteCard: (cardId: string) => void;
  uploadImagePending: boolean;
  deleteImagePending: boolean;
  updateCardPending: boolean;
  fileInputRef: React.RefObject<Record<string, HTMLInputElement | null>>;
}

function SortableFeatureCard({
  card,
  isEditing,
  editData,
  setEditData,
  setEditingCard,
  handleEdit,
  handleSave,
  handleMediaUpload,
  handleImageDelete,
  handleToggleActive,
  handleDeleteCard,
  uploadImagePending,
  deleteImagePending,
  updateCardPending,
  fileInputRef,
}: SortableFeatureCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const IconComponent = iconMap[card.icon_name] || Sparkles;

  return (
    <Card ref={setNodeRef} style={style} className="relative overflow-hidden">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-background/80 backdrop-blur-sm rounded p-1 hover:bg-muted"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Media Section */}
      <div className="relative aspect-video bg-muted">
        {card.image_url ? (
          <>
            {isVideoFile(card.image_url) ? (
              <video 
                src={card.image_url}
                className="w-full h-full object-cover"
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (
              <img 
                src={card.image_url} 
                alt={card.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute top-2 right-2 flex gap-1">
              {isVideoFile(card.image_url) && (
                <Badge variant="secondary" className="h-6">
                  <Video className="h-3 w-3 mr-1" />
                  Video
                </Badge>
              )}
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleImageDelete(card.id)}
                disabled={deleteImagePending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <IconComponent className="h-10 w-10" />
            <span className="text-sm">No media</span>
          </div>
        )}
        
        {/* Upload Button */}
        <input
          type="file"
          ref={(el) => { if (fileInputRef.current) fileInputRef.current[card.id] = el; }}
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleMediaUpload(card.id, file);
          }}
        />
        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
          <div className="flex items-center gap-1 text-xs text-white/80 bg-black/50 px-2 py-1 rounded">
            <Info className="h-3 w-3" />
            <span>1280×720 (16:9), Max 10MB</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.[card.id]?.click()}
            disabled={uploadImagePending}
          >
            {uploadImagePending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </>
            )}
          </Button>
        </div>
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
                disabled={updateCardPending}
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

        {/* Active Toggle & Delete */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Label htmlFor={`active-${card.id}`} className="text-sm">
              Active
            </Label>
            <Switch
              id={`active-${card.id}`}
              checked={card.is_active}
              onCheckedChange={(checked) => handleToggleActive(card.id, checked)}
            />
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Feature Card?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{card.title}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteCard(card.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

export function FeatureCardManagement() {
  const { data: cards, isLoading } = useAdminFeatureCards();
  const updateCard = useUpdateFeatureCard();
  const uploadImage = useUploadFeatureImage();
  const deleteImage = useDeleteFeatureImage();
  const createCard = useCreateFeatureCard();
  const deleteCard = useDeleteFeatureCard();
  const reorderCards = useReorderFeatureCards();
  
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ title: string; description: string }>({ 
    title: '', 
    description: '' 
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCardData, setNewCardData] = useState({ title: '', description: '' });
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && cards) {
      const oldIndex = cards.findIndex((card) => card.id === active.id);
      const newIndex = cards.findIndex((card) => card.id === over.id);

      const reorderedCards = arrayMove(cards, oldIndex, newIndex);
      
      // Update display_order for all cards
      const updates = reorderedCards.map((card, index) => ({
        id: card.id,
        display_order: index,
      }));

      reorderCards.mutate(updates);
    }
  };

  const handleEdit = (card: { id: string; title: string; description: string }) => {
    setEditingCard(card.id);
    setEditData({ title: card.title, description: card.description });
  };

  const handleSave = (cardId: string) => {
    updateCard.mutate({ id: cardId, updates: editData });
    setEditingCard(null);
  };

  const handleMediaUpload = (cardId: string, file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 10MB');
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Only JPG, PNG, WEBP, GIF, MP4, WEBM, MOV files are allowed');
      return;
    }

    uploadImage.mutate({ cardId, file });
  };

  const handleImageDelete = (cardId: string) => {
    deleteImage.mutate(cardId);
  };

  const handleToggleActive = (cardId: string, isActive: boolean) => {
    updateCard.mutate({ id: cardId, updates: { is_active: isActive } });
  };

  const handleCreateCard = () => {
    if (!newCardData.title.trim() || !newCardData.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    createCard.mutate(newCardData, {
      onSuccess: () => {
        setIsAddingNew(false);
        setNewCardData({ title: '', description: '' });
      }
    });
  };

  const handleDeleteCard = (cardId: string) => {
    deleteCard.mutate(cardId);
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Feature Cards Management
        </CardTitle>
        <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew}>
          <Plus className="h-4 w-4 mr-1" />
          Add New Card
        </Button>
      </CardHeader>
      <CardContent>
        {/* Add New Card Form */}
        {isAddingNew && (
          <Card className="mb-6 border-dashed border-2 border-primary/50">
            <CardContent className="p-4 space-y-4">
              <h4 className="font-semibold text-primary">Create New Feature Card</h4>
              <div>
                <Label htmlFor="new-title">Title</Label>
                <Input
                  id="new-title"
                  placeholder="Enter title..."
                  value={newCardData.title}
                  onChange={(e) => setNewCardData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="new-desc">Description</Label>
                <Textarea
                  id="new-desc"
                  placeholder="Enter description..."
                  value={newCardData.description}
                  onChange={(e) => setNewCardData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateCard}
                  disabled={createCard.isPending}
                >
                  {createCard.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-1" />
                  )}
                  Create Card
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewCardData({ title: '', description: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-sm text-muted-foreground mb-4">
          <GripVertical className="h-4 w-4 inline mr-1" />
          Drag cards to reorder their display sequence
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={cards?.map(c => c.id) || []}
            strategy={rectSortingStrategy}
          >
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cards?.map((card) => (
                <SortableFeatureCard
                  key={card.id}
                  card={card}
                  isEditing={editingCard === card.id}
                  editData={editData}
                  setEditData={setEditData}
                  setEditingCard={setEditingCard}
                  handleEdit={handleEdit}
                  handleSave={handleSave}
                  handleMediaUpload={handleMediaUpload}
                  handleImageDelete={handleImageDelete}
                  handleToggleActive={handleToggleActive}
                  handleDeleteCard={handleDeleteCard}
                  uploadImagePending={uploadImage.isPending}
                  deleteImagePending={deleteImage.isPending}
                  updateCardPending={updateCard.isPending}
                  fileInputRef={fileInputRefs}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}