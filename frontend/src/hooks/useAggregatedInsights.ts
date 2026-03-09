import { useState, useEffect, useCallback } from 'react';
import type { AggregatedInsightsParams } from '../api/aggregatedInsights'
import { getAggregatedInsights } from '../api/aggregatedInsights'
import type { AggregatedInsights } from '../types/insights';

export const useAggregatedInsights = (initialParams: AggregatedInsightsParams = {}) => {
  const [params, setParams] = useState<AggregatedInsightsParams>(initialParams);
  const [data, setData] = useState<AggregatedInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAggregatedInsights(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    params,
    setParams,
    data,
    loading,
    error,
    refetch: fetchInsights,
  };
};