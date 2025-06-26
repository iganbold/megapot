// MegaPot subgraph GraphQL client and utilities

export { megapotClient } from './client';

// Types
export type {
  TicketPurchase,
  WinWithdrawal,
  ReferralWithdrawal,
  UserProfile,
  TicketHistoryResponse,
  UserProfileResponse,
} from './types';

// Queries
export { GET_TICKET_HISTORY } from './queries/getTicketHistory';
export { GET_USER_PROFILE } from './queries/getUserProfile';

// Fetchers
export { fetchTicketHistory } from './fetchers/fetchTicketHistory';
export { fetchUserProfile } from './fetchers/fetchUserProfile'; 