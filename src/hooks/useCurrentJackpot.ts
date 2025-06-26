import { useMemo } from 'react';
import { useJackpotData } from './useJackpotData';
import { calculateJackpotStats, type JackpotStats } from '@/lib/megapot/jackpot-calculations';

export function useCurrentJackpot() {
  const { data, isLoading, error, contractAddress } = useJackpotData();

  const calculations: JackpotStats | null = useMemo(() => {
    if (!data) return null;
    
    try {
      return calculateJackpotStats(data);
    } catch (err) {
      console.error('Error calculating jackpot stats:', err);
      return null;
    }
  }, [data]);

  return {
    // Spread calculations or provide defaults
    formattedJackpot: calculations?.formattedJackpot || '0',
    timeLeft: calculations?.timeLeft || 0,
    price: calculations?.price || '1',
    odds: calculations?.odds || 'N/A',
    ticketCount: calculations?.ticketCount || 0,
    
    // Meta state
    isLoading,
    error,
    contractAddress,
    hasData: !!calculations,
  };
} 