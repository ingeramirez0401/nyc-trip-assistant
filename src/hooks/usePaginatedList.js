import { useState, useEffect, useRef, useCallback } from 'react';

// Compartido entre SuperAdminPanel (agencias) y AgencyAdminPanel
// (licencias) -- mismo patrón de buscar+paginar en ambos, construido una
// sola vez. `fetchPage` recibe { page, pageSize, search, ...filters } y
// debe devolver { items, total, ...resto } (el resto del payload se
// expone tal cual en `extra`, por ejemplo las métricas server-side de
// licencias).
export function usePaginatedList(fetchPage, { pageSize = 20, debounceMs = 400 } = {}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFiltersState] = useState({});
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [extra, setExtra] = useState({});
  const [loading, setLoading] = useState(true);
  const debounceTimer = useRef(null);

  // Debounce del texto de búsqueda -- mismo patrón que
  // AgencyAdminPanel.jsx::handleEmailChange. Cambiar de búsqueda vuelve a
  // la página 1 (una página 5 de la búsqueda anterior no tiene sentido
  // para el término nuevo).
  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, debounceMs);
    return () => clearTimeout(debounceTimer.current);
  }, [search, debounceMs]);

  const setFilters = useCallback((next) => {
    setFiltersState(next);
    setPage(1);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items: data, total: count, ...rest } = await fetchPage({
        page,
        pageSize,
        search: debouncedSearch,
        ...filters,
      });
      setItems(data || []);
      setTotal(count || 0);
      setExtra(rest);
    } finally {
      setLoading(false);
    }
  }, [fetchPage, page, pageSize, debouncedSearch, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items,
    setItems,
    total,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    filters,
    setFilters,
    loading,
    reload: load,
    extra,
  };
}
