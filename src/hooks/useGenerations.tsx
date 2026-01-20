import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Generation {
  id: string;
  image_name: string;
  image_url: string;
  prompt: string;
  title: string;
  description: string;
  tags: string;
  created_at: string;
}

export function useGenerations() {
  const { user } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGenerations = async () => {
    if (!user) {
      setGenerations([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching generations:', error);
      setGenerations([]);
    } else {
      setGenerations(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGenerations();
  }, [user]);

  const addGeneration = (generation: Generation) => {
    setGenerations(prev => [generation, ...prev]);
  };

  const deleteGeneration = async (id: string) => {
    const { error } = await supabase
      .from('generations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting generation:', error);
      return false;
    }

    setGenerations(prev => prev.filter(g => g.id !== id));
    return true;
  };

  const refreshGenerations = () => {
    setLoading(true);
    fetchGenerations();
  };

  return { generations, loading, addGeneration, deleteGeneration, refreshGenerations };
}
