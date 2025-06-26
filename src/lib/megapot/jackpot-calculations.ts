import { formatUnits } from 'viem';

export interface JackpotRawData {
  userPoolTotal: bigint;
  lpPoolTotal: bigint;
  lastJackpotEndTime: bigint;
  roundDurationInSeconds: bigint;
  ticketPrice: bigint;
  tokenDecimals: bigint;
  ticketCountTotalBps: bigint;
  feeBps: bigint;
}

export interface JackpotStats {
  formattedJackpot: string;
  timeLeft: number;
  price: string;
  odds: string;
  ticketCount: number;
}

export function calculateJackpotStats(data: JackpotRawData): JackpotStats {
  const {
    userPoolTotal,
    lpPoolTotal,
    lastJackpotEndTime,
    roundDurationInSeconds,
    ticketPrice,
    tokenDecimals,
    ticketCountTotalBps,
    feeBps,
  } = data;

  // Token decimals for formatting
  const decimals = Number(tokenDecimals);

  // Jackpot amount: greater of the two pools
  const jackpotAmount = userPoolTotal > lpPoolTotal ? userPoolTotal : lpPoolTotal;
  const formattedJackpot = formatUnits(jackpotAmount, decimals);

  // Calculate odds: jackpotAmount / (ticketPrice * (1 - feeBps / 10000))
  const feeMultiplier = 1 - Number(feeBps) / 10000;
  const oddsRaw = feeMultiplier > 0
    ? Number(jackpotAmount) / (Number(ticketPrice) * feeMultiplier)
    : 0;
  const formattedOdds = oddsRaw > 0
    ? oddsRaw.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : 'N/A';

  // Ticket price formatting
  const price = formatUnits(ticketPrice, decimals);

  // Time remaining calculation
  const end = Number(lastJackpotEndTime) + Number(roundDurationInSeconds);
  const now = Math.floor(Date.now() / 1000);
  const timeLeft = Math.max(0, end - now);

  // Ticket count for reference
  const ticketCount = Number(ticketCountTotalBps) / 10000;

  return {
    formattedJackpot,
    timeLeft,
    price,
    odds: formattedOdds,
    ticketCount,
  };
} 