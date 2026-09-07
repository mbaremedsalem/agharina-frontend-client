import { useCallback, useEffect, useState } from "react";
import { api } from "./client";

/** Charge une liste complete (toutes les pages) depuis l'API. */
export function useResource(endpoint, params) {
  const paramsKey = JSON.stringify(params ?? null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!endpoint) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.list(endpoint, params);
      setItems(data);
    } catch (err) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, paramsKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, error, reload };
}

/** Charge une seule page (pour une liste paginee avec "voir plus" / pages). */
export function usePaginatedResource(endpoint, params) {
  const paramsKey = JSON.stringify(params ?? null);
  const [data, setData] = useState({ results: [], count: 0, next: null, previous: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!endpoint) {
      setData({ results: [], count: 0, next: null, previous: null });
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .page(endpoint, params)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Erreur de chargement");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, paramsKey]);

  return { ...data, loading, error };
}
