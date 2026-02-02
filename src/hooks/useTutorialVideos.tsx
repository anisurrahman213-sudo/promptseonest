import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TutorialVideo {
  id: string;
  title: string;
  title_key: string;
  description: string;
  description_key: string;
  icon_name: string;
  duration: string;
  video_url: string | null;
  thumbnail_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useTutorialVideos() {
  return useQuery({
    queryKey: ["tutorial-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tutorial_videos")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as TutorialVideo[];
    },
  });
}

export function useAdminTutorialVideos() {
  return useQuery({
    queryKey: ["admin-tutorial-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tutorial_videos")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as TutorialVideo[];
    },
  });
}

export function useCreateTutorialVideo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (video: Omit<TutorialVideo, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("tutorial_videos")
        .insert(video)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorial-videos"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tutorial-videos"] });
      toast({ title: "Tutorial video created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create tutorial", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateTutorialVideo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TutorialVideo> & { id: string }) => {
      const { data, error } = await supabase
        .from("tutorial_videos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorial-videos"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tutorial-videos"] });
      toast({ title: "Tutorial video updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update tutorial", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteTutorialVideo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tutorial_videos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorial-videos"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tutorial-videos"] });
      toast({ title: "Tutorial video deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete tutorial", description: error.message, variant: "destructive" });
    },
  });
}

export function useReorderTutorialVideos() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (videos: { id: string; display_order: number }[]) => {
      const updates = videos.map(({ id, display_order }) =>
        supabase.from("tutorial_videos").update({ display_order }).eq("id", id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw new Error("Failed to reorder tutorials");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutorial-videos"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tutorial-videos"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to reorder tutorials", description: error.message, variant: "destructive" });
    },
  });
}
