import { gql } from 'graphql-request';

export const GET_USER_PROFILE = gql`
  query GetUserProfile($walletAddress: Bytes!) {
    user(id: $walletAddress) {
      totalTicketsPurchased
      totalTicketsPurchasedBps
      ticketPurchaseCount
      totalWinningsWithdrawn
      totalWinnings
      winWithdrawalCount
      firstActivityTime
      lastActivityTime
      firstTicketPurchaseTime
      lastTicketPurchaseTime
      activityCount
      isLiquidityProvider
      totalLpDeposited
      totalLpPrincipalWithdrawn
      currentLpPosition
      lpDepositCount
      lpWithdrawalCount
      ticketPurchases(first: 10, orderBy: blockTimestamp, orderDirection: desc) {
        id
        ticketsPurchased
        ticketsPurchasedTotalBps
        blockTimestamp
        transactionHash
        referrer
        buyer
      }
      winWithdrawals(first: 100, orderBy: blockTimestamp, orderDirection: desc) {
        id
        amount
        blockTimestamp
        transactionHash
      }
      referralWithdrawals(first: 10, orderBy: blockTimestamp, orderDirection: desc) {
        id
        amount
        blockTimestamp
        transactionHash
      }
    }
  }
`; 