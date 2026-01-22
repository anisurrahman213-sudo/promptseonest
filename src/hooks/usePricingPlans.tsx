import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PricingPlan {
  id: string;
  name: string;
  price_usd: number;
  price_bdt: number;
  period: string | null;
  description: string;
  credits: string;
  credits_amount: number;
  features: string[];
  is_free: boolean;
  is_unlimited: boolean;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function usePricingPlans() {
  return useQuery({
    queryKey: ['pricing-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as PricingPlan[];
    },
  });
}

export function useAdminPricingPlans() {
  return useQuery({
    queryKey: ['admin-pricing-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as PricingPlan[];
    },
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: Omit<PricingPlan, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .insert(plan)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pricing-plans'] });
      toast.success('Plan created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create plan: ' + error.message);
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PricingPlan> & { id: string }) => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pricing-plans'] });
      toast.success('Plan updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update plan: ' + error.message);
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pricing_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pricing-plans'] });
      toast.success('Plan deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete plan: ' + error.message);
    },
  });
}
