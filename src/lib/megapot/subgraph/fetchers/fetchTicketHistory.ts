import { megapotClient } from '../client';
import { GET_TICKET_HISTORY } from '../queries/getTicketHistory';
import { TicketHistoryResponse, TicketPurchase } from '../types';

export const fetchTicketHistory = async (walletAddress: string): Promise<TicketPurchase[]> => {
  const data = await megapotClient.request<TicketHistoryResponse>(GET_TICKET_HISTORY, {
    walletAddress: walletAddress.toLowerCase(),
  });
  return data.userTicketPurchases;
}; 