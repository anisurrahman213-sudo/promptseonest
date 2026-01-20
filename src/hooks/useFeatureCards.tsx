import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useFeatureCards() {
  return useQuery({
    queryKey: ['feature-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_cards')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as FeatureCard[];
    },
  });
}

export function useAdminFeatureCards() {
  return useQuery({
    queryKey: ['admin-feature-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_cards')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as FeatureCard[];
    },
  });
}

export function useUpdateFeatureCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FeatureCard> }) => {
      const { data, error } = await supabase
        .from('feature_cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-cards'] });
      queryClient.invalidateQueries({ queryKey: ['admin-feature-cards'] });
      toast.success('Feature card updated!');
    },
    onError: (error) => {
      toast.error('Failed to update feature card');
      console.error(error);
    },
  });
}

export function useUploadFeatureImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, file }: { cardId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `feature-${cardId}-${Date.now()}.${fileExt}`;
      const filePath = `feature-cards/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Update feature card with image URL
      const { data, error } = await supabase
        .from('feature_cards')
        .update({ image_url: publicUrl })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-cards'] });
      queryClient.invalidateQueries({ queryKey: ['admin-feature-cards'] });
      toast.success('Image uploaded!');
    },
    onError: (error) => {
      toast.error('Failed to upload image');
      console.error(error);
    },
  });
}

export function useDeleteFeatureImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      const { data, error } = await supabase
        .from('feature_cards')
        .update({ image_url: null })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-cards'] });
      queryClient.invalidateQueries({ queryKey: ['admin-feature-cards'] });
      toast.success('Image removed!');
    },
    onError: (error) => {
      toast.error('Failed to remove image');
      console.error(error);
    },
  });
}
