import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    if (!user) {
      setCredits(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching credits:', error);
      setCredits(null);
    } else {
      setCredits(data?.credits ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCredits();
  }, [user]);

  const refreshCredits = () => {
    setLoading(true);
    fetchCredits();
  };

  return { credits, loading, refreshCredits };
}
