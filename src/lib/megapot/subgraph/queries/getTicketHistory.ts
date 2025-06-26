import { gql } from 'graphql-request';

export const GET_TICKET_HISTORY = gql`
  query TicketHistory($walletAddress: Bytes!) {
    userTicketPurchases(where: { user: $walletAddress }) {
      blockNumber
      blockTimestamp
      buyer
      id
      recipient
      referrer
      ticketsPurchased
      ticketsPurchasedTotalBps
      transactionHash
    }
  }
`; 