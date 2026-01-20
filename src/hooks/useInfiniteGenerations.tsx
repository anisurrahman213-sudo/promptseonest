import { useState, useEffect, useCallback, useRef } from 'react';
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

interface UseInfiniteGenerationsOptions {
  pageSize?: number;
}

export function useInfiniteGenerations(options: UseInfiniteGenerationsOptions = {}) {
  const { pageSize = 12 } = options;
  const { user } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const pageRef = useRef(1);

  const fetchGenerations = useCallback(async (page: number, append: boolean = false) => {
    if (!user) {
      setGenerations([]);
      setLoading(false);
      return;
    }

    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
      // Get total count first (only on first page)
      if (page === 1) {
        const { count } = await supabase
          .from('generations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        setTotalCount(count || 0);
      }

      // Get paginated data
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Error fetching generations:', error);
        if (!append) setGenerations([]);
      } else {
        const newData = data || [];
        
        if (append) {
          setGenerations(prev => [...prev, ...newData]);
        } else {
          setGenerations(newData);
        }
        
        // Check if there are more items
        setHasMore(newData.length === pageSize);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, pageSize]);

  // Initial load
  useEffect(() => {
    pageRef.current = 1;
    fetchGenerations(1, false);
  }, [fetchGenerations]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    pageRef.current += 1;
    fetchGenerations(pageRef.current, true);
  }, [loadingMore, hasMore, fetchGenerations]);

  const addGeneration = useCallback((generation: Generation) => {
    setGenerations(prev => [generation, ...prev]);
    setTotalCount(prev => prev + 1);
  }, []);

  const deleteGeneration = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('generations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting generation:', error);
      return false;
    }

    setGenerations(prev => prev.filter(g => g.id !== id));
    setTotalCount(prev => prev - 1);
    return true;
  }, []);

  const refreshGenerations = useCallback(() => {
    pageRef.current = 1;
    setHasMore(true);
    fetchGenerations(1, false);
  }, [fetchGenerations]);

  return {
    generations,
    loading,
    loadingMore,
    hasMore,
    totalCount,
    loadMore,
    addGeneration,
    deleteGeneration,
    refreshGenerations,
  };
}
