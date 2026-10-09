'use client';

import { useEffect, useState } from 'react';
import type { RecommendationResult, RecommendationResponseData } from '@/lib/recommendations';

export function useRecommendations(query: string) {
  const [results, setResults] = useState<RecommendationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null);
  const [intents, setIntents] = useState<RecommendationResponseData['intents']>(null);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [modelVersion, setModelVersion] = useState<string>('aura-neural-ranker-v2');
  const [candidatesCount, setCandidatesCount] = useState<number>(0);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setResults([]);
      setExpandedQuery(null);
      setIntents(null);
      setLatencyMs(0);
      setCandidatesCount(0);
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
          body: JSON.stringify({ query: trimmedQuery, top_k: 8 }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Recommendation request failed');
        }

        const data: RecommendationResponseData = await response.json();
        setResults(Array.isArray(data?.results) ? data.results : []);
        setExpandedQuery(data?.expanded_query || null);
        setIntents(data?.intents || null);
        setLatencyMs(data?.latency_ms || 0);
        setModelVersion(data?.model_version || 'aura-neural-ranker-v2');
        setCandidatesCount(data?.num_candidates_considered || 0);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setExpandedQuery(null);
          setIntents(null);
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

  return { 
    results, 
    isLoading,
    expandedQuery,
    intents,
    latencyMs,
    modelVersion,
    candidatesCount,
  };
}