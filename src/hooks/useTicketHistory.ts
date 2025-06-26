import useSWR from 'swr';
import { fetchTicketHistory } from '@/lib/megapot/subgraph/fetchers/fetchTicketHistory';
import { TicketPurchase } from '@/lib/megapot/subgraph/types';

export function useTicketHistory(walletAddress?: string) {
  const shouldFetch = !!walletAddress;

  const { data, error, isLoading } = useSWR<TicketPurchase[]>(
    shouldFetch ? ['ticket-history', walletAddress] : null,
    () => fetchTicketHistory(walletAddress!),
    { revalidateOnFocus: false }
  );

  return {
    history: data,
    isLoading,
    isError: error,
  };
} 