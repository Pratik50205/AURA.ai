'use client';

import { useEffect, useState } from 'react';
import type { RecommendationResult } from '@/lib/recommendations';

export function useRecommendations(query: string) {
  const [results, setResults] = useState<RecommendationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchRecommendations() {
      setIsLoading(true);

      try {
        const response = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmedQuery, top_k: 5 }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Recommendation request failed');
        }

        const data = await response.json();
        setResults(Array.isArray(data?.results) ? data.results : []);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchRecommendations();
    return () => controller.abort();
  }, [query]);

  return { results, isLoading };
}