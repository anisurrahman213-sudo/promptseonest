import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  created_at: string;
  updated_at: string;
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');
      
      if (error) throw error;
      return data as SiteSetting[];
    },
  });
}

export function useSiteSetting(key: string) {
  return useQuery({
    queryKey: ['site-settings', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', key)
        .maybeSingle();
      
      if (error) throw error;
      return data as SiteSetting | null;
    },
  });
}

export function useUpdateSiteSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string | null }) => {
      // Try to upsert (insert or update)
      const { data, error } = await supabase
        .from('site_settings')
        .upsert(
          { setting_key: key, setting_value: value },
          { onConflict: 'setting_key' }
        )
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Setting updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update setting');
    },
  });
}

export function useUploadHeroImage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `hero-background-${Date.now()}.${fileExt}`;
      const filePath = `hero/${fileName}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
      
      // Save to site_settings
      const { error: settingError } = await supabase
        .from('site_settings')
        .upsert(
          { setting_key: 'hero_background_url', setting_value: publicUrl },
          { onConflict: 'setting_key' }
        );
      
      if (settingError) throw settingError;
      
      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Hero background uploaded successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload image');
    },
  });
}

export function useDeleteHeroImage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (imageUrl: string) => {
      // Extract file path from URL
      const urlParts = imageUrl.split('/images/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage
          .from('images')
          .remove([filePath]);
      }
      
      // Remove from site_settings
      const { error } = await supabase
        .from('site_settings')
        .update({ setting_value: null })
        .eq('setting_key', 'hero_background_url');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Hero background deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete image');
    },
  });
}
