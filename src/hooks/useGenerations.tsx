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
  media_type: 'image' | 'video';
  category?: string;
  is_editorial?: boolean;
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
      setGenerations((data || []) as Generation[]);
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

  const updateGeneration = async (id: string, data: Partial<Generation>): Promise<boolean> => {
    const { error } = await supabase
      .from('generations')
      .update(data)
      .eq('id', id);

    if (error) {
      console.error('Error updating generation:', error);
      return false;
    }

    setGenerations(prev => prev.map(g => 
      g.id === id ? { ...g, ...data } : g
    ));
    return true;
  };

  const updateCategory = async (id: string, category: string): Promise<boolean> => {
    return updateGeneration(id, { category });
  };

  const updateMetadata = async (id: string, data: Partial<Generation>): Promise<boolean> => {
    return updateGeneration(id, data);
  };

  const refreshGenerations = () => {
    setLoading(true);
    fetchGenerations();
  };

  return { 
    generations, 
    loading, 
    addGeneration, 
    deleteGeneration, 
    updateCategory,
    updateMetadata,
    refreshGenerations 
  };
}
