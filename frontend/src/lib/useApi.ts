"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseApiResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  isLive: boolean;
  refetch: () => void;
}

export function useApi<T>(
  fetcher: () => Promise<T | null>,
  fallback: T,
  intervalMs?: number,
): UseApiResult<T> {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doFetch = useCallback(async () => {
    try {
      const result = await fetcher();
      if (result !== null) {
        setData(result);
        setIsLive(true);
        setError(null);
      } else {
        setData(fallback);
        setIsLive(false);
      }
    } catch (e) {
      setData(fallback);
      setIsLive(false);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [fetcher, fallback]);

  useEffect(() => {
    doFetch();
    if (intervalMs && intervalMs > 0) {
      intervalRef.current = setInterval(doFetch, intervalMs);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [doFetch, intervalMs]);

  return { data, loading, error, isLive, refetch: doFetch };
}
