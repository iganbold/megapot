import { megapotClient } from '../client';
import { GET_USER_PROFILE } from '../queries/getUserProfile';
import { UserProfileResponse, UserProfile } from '../types';

export const fetchUserProfile = async (walletAddress: string): Promise<UserProfile | null> => {
  const data = await megapotClient.request<UserProfileResponse>(GET_USER_PROFILE, {
    walletAddress: walletAddress.toLowerCase(),
  });
  return data.user;
}; 