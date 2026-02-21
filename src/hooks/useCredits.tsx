import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useCredits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: credits, isLoading: loading } = useQuery({
    queryKey: ['user-credits', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('user_id', user!.id)
        .single();

      if (error) {
        console.error('Error fetching credits:', error);
        return null;
      }
      return data?.credits ?? 0;
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds cache
  });

  const refreshCredits = () => {
    queryClient.invalidateQueries({ queryKey: ['user-credits', user?.id] });
  };

  return { credits: credits ?? null, loading, refreshCredits };
}
