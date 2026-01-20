import { useState, useEffect, useMemo, useCallback } from 'react';
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

interface UsePaginatedGenerationsOptions {
  pageSize?: number;
}

export function usePaginatedGenerations(options: UsePaginatedGenerationsOptions = {}) {
  const { pageSize = 12 } = options;
  const { user } = useAuth();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const totalPages = useMemo(() => Math.ceil(totalCount / pageSize), [totalCount, pageSize]);

  const fetchGenerations = useCallback(async (page: number) => {
    if (!user) {
      setGenerations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Get total count first
    const { count } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    setTotalCount(count || 0);

    // Then get paginated data
    const { data, error } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching generations:', error);
      setGenerations([]);
    } else {
      setGenerations(data || []);
      setHasMore((count || 0) > to + 1);
    }
    setLoading(false);
  }, [user, pageSize]);

  useEffect(() => {
    fetchGenerations(currentPage);
  }, [currentPage, fetchGenerations]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const addGeneration = useCallback((generation: Generation) => {
    // Add to the beginning and refresh to maintain pagination
    setGenerations(prev => [generation, ...prev.slice(0, pageSize - 1)]);
    setTotalCount(prev => prev + 1);
  }, [pageSize]);

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
    
    // If we deleted the last item on a page, go to previous page
    if (generations.length === 1 && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    } else {
      // Refresh current page
      fetchGenerations(currentPage);
    }
    
    return true;
  }, [currentPage, generations.length, fetchGenerations]);

  const refreshGenerations = useCallback(() => {
    fetchGenerations(currentPage);
  }, [currentPage, fetchGenerations]);

  return {
    generations,
    loading,
    currentPage,
    totalPages,
    totalCount,
    hasMore,
    goToPage,
    nextPage,
    prevPage,
    addGeneration,
    deleteGeneration,
    refreshGenerations,
  };
}
