
import { useState, useCallback } from 'react';
import { supabase } from '../supabase/supabase';

export function usePaginatedQuery(
  table,
  pageSize = 10,
  searchText = '',
  sort = { column: 'created_at', ascending: false },
  filter,
) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalFetched, setTotalFetched] = useState(0); // Track total items fetched from server

  const buildSelectQuery = useCallback(tableName => {
    switch (tableName) {
      case 'products':
        return `
          *,
          product_categories (
            category_id,
            category (
              id,
              name
            )
          )
        `;
      case 'category':
        return '*';
      default:
        return '*';
    }
  }, []);

  const fetchPage = useCallback(
    async (reset = false) => {
      const nextPage = reset ? 0 : page;

      if (
        (loadingInitial && !reset) ||
        (loadingMore && !reset) ||
        (!hasMore && !reset)
      )
        return;

      reset ? setLoadingInitial(true) : setLoadingMore(true);

      const from = nextPage * pageSize;
      const to = from + pageSize - 1;

      try {
        let query = supabase.from(table).select(buildSelectQuery(table));

        if (typeof filter === 'function') {
          query = filter(query);
        }

        if (searchText?.trim()) {
          query = query.ilike('name', `%${searchText}%`);
        }

        if (sort?.column) {
          query = query.order(sort.column, { ascending: sort.ascending });
          if (sort.column !== 'created_at')
            query = query.order('created_at', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        query = query.range(from, to);

        const { data: newData, error } = await query;
        if (error) throw error;

        if (reset) {
          setData(newData || []);
          setPage(1);
          setTotalFetched((newData || []).length);
        } else {
          setData(prev => {
            const existingIds = new Set(prev.map(item => item.id));
            const filteredNew = (newData || []).filter(
              item => !existingIds.has(item.id),
            );
            return [...prev, ...filteredNew];
          });
          setPage(p => p + 1);
          setTotalFetched(prev => prev + (newData || []).length);
        }

        setHasMore((newData || []).length === pageSize);
      } catch (err) {
        console.log('[Pagination error]:', err.message || err);
      } finally {
        setLoadingInitial(false);
        setLoadingMore(false);
      }
    },
    [
      page,
      pageSize,
      table,
      searchText,
      sort,
      hasMore,
      loadingInitial,
      loadingMore,
      buildSelectQuery,
      filter,
    ],
  );

  const reset = useCallback(() => {
    setData([]);
    setPage(0);
    setHasMore(true);
    setTotalFetched(0);
  }, []);

  return {
    data,
    loadingInitial,
    loadingMore,
    hasMore,
    fetchPage,
    reset,
    setData,
    pageSize,
    totalFetched, // Export this
  };
}
