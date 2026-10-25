import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../api/axios';
import { useToast } from '../components/Toast.jsx';

export default function useList(path, defaultSort, externalSearch = '') {
  const { push } = useToast();
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState(defaultSort);
  const [order, setOrder] = useState('asc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(externalSearch);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [externalSearch]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(path, {
        params: { search: query, page, limit: 10, sortBy, order }
      });
      setRows(data.data || []);
      setPagination(data.pagination || { total: 0, page, limit: 10, totalPages: 0 });
    } catch (err) {
      push(errorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [path, query, page, sortBy, order, push]);

  useEffect(() => {
    reload();
  }, [reload]);

  const onSort = (key) => {
    if (sortBy === key) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setOrder('asc');
    }
    setPage(1);
  };

  return {
    rows,
    pagination,
    page,
    setPage,
    sortBy,
    order,
    onSort,
    loading,
    reload
  };
}
