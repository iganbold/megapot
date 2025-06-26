import useSWR from 'swr';
import { fetchUserProfile } from '@/lib/megapot/subgraph/fetchers/fetchUserProfile';
import { UserProfile } from '@/lib/megapot/subgraph/types';

export function useUserProfile(walletAddress?: string) {
  const shouldFetch = !!walletAddress;

  const { data, error, isLoading } = useSWR<UserProfile | null>(
    shouldFetch ? ['user-profile', walletAddress] : null,
    () => fetchUserProfile(walletAddress!),
    { revalidateOnFocus: false }
  );

  return {
    profile: data,
    isLoading,
    isError: error,
  };
} 