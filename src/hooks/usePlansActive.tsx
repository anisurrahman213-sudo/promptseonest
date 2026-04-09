import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePlansActive() {
  return useQuery({
    queryKey: ['plans-active-check'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('pricing_plans')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) throw error;
      return (count ?? 0) > 0;
    },
    staleTime: 60000,
  });
}
