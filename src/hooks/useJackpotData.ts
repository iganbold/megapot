import { useReadContracts } from 'wagmi';
import jackpotAbi from '@/lib/abi/jackpotAbi';
import { config } from '@/lib/config';
import { type JackpotRawData } from '@/lib/megapot/jackpot-calculations';

export function useJackpotData() {
  const contractAddress = config.megapotProxyContractAddress as `0x${string}`;

  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: contractAddress,
        abi: jackpotAbi,
        functionName: 'userPoolTotal',
      },
      {
        address: contractAddress,
        abi: jackpotAbi,
        functionName: 'lpPoolTotal',
      },
      {
        address: contractAddress,
        abi: jackpotAbi,
        functionName: 'lastJackpotEndTime',
      },
      {
        address: contractAddress,
        abi: jackpotAbi,
        functionName: 'roundDurationInSeconds',
      },
      {
        address: contractAddress,
        abi: jackpotAbi,
        functionName: 'ticketPrice',
      },
      {
        address: contractAddress,
        abi: jackpotAbi,
        functionName: 'tokenDecimals',
      },
      {
        address: contractAddress,
        abi: jackpotAbi,
        functionName: 'ticketCountTotalBps',
      },
      {
        address: contractAddress,
        abi: jackpotAbi,
        functionName: 'feeBps',
      },
    ],
    query: {
      enabled: !!contractAddress,
      staleTime: 30_000, // 30 seconds
      refetchInterval: 60_000, // 1 minute
    },
  });

  // Transform the raw data into typed format
  const transformedData: JackpotRawData | null = data
    ? {
        userPoolTotal: data[0]?.result as bigint || 0n,
        lpPoolTotal: data[1]?.result as bigint || 0n,
        lastJackpotEndTime: data[2]?.result as bigint || 0n,
        roundDurationInSeconds: data[3]?.result as bigint || 0n,
        ticketPrice: data[4]?.result as bigint || 0n,
        tokenDecimals: data[5]?.result as bigint || 6n,
        ticketCountTotalBps: data[6]?.result as bigint || 0n,
        feeBps: data[7]?.result as bigint || 0n,
      }
    : null;

  return {
    data: transformedData,
    isLoading,
    error: error || (!contractAddress ? new Error('Contract address not found for current chain') : null),
    contractAddress,
  };
} 