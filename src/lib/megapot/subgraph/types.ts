// MegaPot GraphQL Schema Types

export interface TicketPurchase {
  blockNumber: string;
  blockTimestamp: string;
  buyer: string;
  id: string;
  recipient: string;
  referrer: string;
  ticketsPurchased: string;
  ticketsPurchasedTotalBps: string;
  transactionHash: string;
}

export interface WinWithdrawal {
  id: string;
  amount: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface ReferralWithdrawal {
  id: string;
  amount: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface UserProfile {
  totalTicketsPurchased: string;
  totalTicketsPurchasedBps: string;
  ticketPurchaseCount: string;
  totalWinningsWithdrawn: string;
  totalWinnings: string;
  winWithdrawalCount: string;
  firstActivityTime: string;
  lastActivityTime: string;
  firstTicketPurchaseTime: string;
  lastTicketPurchaseTime: string;
  activityCount: string;
  isLiquidityProvider: boolean;
  totalLpDeposited: string;
  totalLpPrincipalWithdrawn: string;
  currentLpPosition: string;
  lpDepositCount: string;
  lpWithdrawalCount: string;
  ticketPurchases: TicketPurchase[];
  winWithdrawals: WinWithdrawal[];
  referralWithdrawals: ReferralWithdrawal[];
}

export interface TicketHistoryResponse {
  userTicketPurchases: TicketPurchase[];
}

export interface UserProfileResponse {
  user: UserProfile | null;
} 