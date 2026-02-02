import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useAdminTutorialVideos,
  useCreateTutorialVideo,
  useUpdateTutorialVideo,
  useDeleteTutorialVideo,
  TutorialVideo,
} from "@/hooks/useTutorialVideos";
import { Plus, Edit, Trash2, Video, GripVertical, ExternalLink } from "lucide-react";

const iconOptions = ["Play", "UserPlus", "Settings", "Sparkles", "Video", "BookOpen", "Zap", "Star"];

export function TutorialManagement() {
  const { t } = useTranslation();
  const { data: tutorials, isLoading } = useAdminTutorialVideos();
  const createMutation = useCreateTutorialVideo();
  const updateMutation = useUpdateTutorialVideo();
  const deleteMutation = useDeleteTutorialVideo();

  const [editingTutorial, setEditingTutorial] = useState<TutorialVideo | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    title_key: "",
    description: "",
    description_key: "",
    icon_name: "Play",
    duration: "0:00",
    video_url: "",
    thumbnail_url: "",
    display_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      title_key: "",
      description: "",
      description_key: "",
      icon_name: "Play",
      duration: "0:00",
      video_url: "",
      thumbnail_url: "",
      display_order: tutorials?.length ?? 0,
      is_active: true,
    });
  };

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      ...formData,
      video_url: formData.video_url || null,
      thumbnail_url: formData.thumbnail_url || null,
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingTutorial) return;
    await updateMutation.mutateAsync({
      id: editingTutorial.id,
      ...formData,
      video_url: formData.video_url || null,
      thumbnail_url: formData.thumbnail_url || null,
    });
    setEditingTutorial(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this tutorial?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const openEditDialog = (tutorial: TutorialVideo) => {
    setEditingTutorial(tutorial);
    setFormData({
      title: tutorial.title,
      title_key: tutorial.title_key,
      description: tutorial.description,
      description_key: tutorial.description_key,
      icon_name: tutorial.icon_name,
      duration: tutorial.duration,
      video_url: tutorial.video_url || "",
      thumbnail_url: tutorial.thumbnail_url || "",
      display_order: tutorial.display_order,
      is_active: tutorial.is_active,
    });
  };

  const TutorialForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Title (Display)</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Getting Started"
          />
        </div>
        <div className="space-y-2">
          <Label>Title Key (i18n)</Label>
          <Input
            value={formData.title_key}
            onChange={(e) => setFormData({ ...formData, title_key: e.target.value })}
            placeholder="tutorials.signupTitle"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description (Display)</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Learn how to create your account..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Description Key (i18n)</Label>
        <Input
          value={formData.description_key}
          onChange={(e) => setFormData({ ...formData, description_key: e.target.value })}
          placeholder="tutorials.signupDesc"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Icon</Label>
          <select
            value={formData.icon_name}
            onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
            className="w-full h-10 px-3 rounded-md border border-input bg-background"
          >
            {iconOptions.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Duration</Label>
          <Input
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            placeholder="5:00"
          />
        </div>
        <div className="space-y-2">
          <Label>Order</Label>
          <Input
            type="number"
            value={formData.display_order}
            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Video URL (YouTube Embed)</Label>
        <Input
          value={formData.video_url}
          onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
          placeholder="https://www.youtube.com/embed/VIDEO_ID"
        />
        <p className="text-xs text-muted-foreground">
          Use YouTube embed URL format: https://www.youtube.com/embed/VIDEO_ID
        </p>
      </div>

      <div className="space-y-2">
        <Label>Thumbnail URL (Optional)</Label>
        <Input
          value={formData.thumbnail_url}
          onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
          placeholder="https://example.com/thumbnail.jpg"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label>Active (visible on tutorials page)</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => {
            isEdit ? setEditingTutorial(null) : setIsCreateOpen(false);
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={isEdit ? handleUpdate : handleCreate}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {isEdit ? "Update" : "Create"} Tutorial
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tutorial Videos</h3>
          <p className="text-sm text-muted-foreground">
            Manage tutorial video URLs and content for the help page
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tutorial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Tutorial</DialogTitle>
            </DialogHeader>
            <TutorialForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {tutorials?.map((tutorial) => (
          <Card key={tutorial.id} className={!tutorial.is_active ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="text-muted-foreground cursor-grab">
                  <GripVertical className="h-5 w-5" />
                </div>
                
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Video className="h-6 w-6 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{tutorial.title}</h4>
                    <Badge variant="outline" className="shrink-0">
                      {tutorial.duration}
                    </Badge>
                    {!tutorial.is_active && (
                      <Badge variant="secondary" className="shrink-0">
                        Hidden
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {tutorial.description}
                  </p>
                  {tutorial.video_url && (
                    <a
                      href={tutorial.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {tutorial.video_url.substring(0, 50)}...
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(tutorial)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(tutorial.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {tutorials?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No tutorials yet. Click "Add Tutorial" to create one.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTutorial} onOpenChange={(open) => !open && setEditingTutorial(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Tutorial</DialogTitle>
          </DialogHeader>
          <TutorialForm isEdit />
        </DialogContent>
      </Dialog>
    </div>
  );
}
