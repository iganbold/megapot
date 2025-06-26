'use client';

import { useTicketHistory } from '@/hooks/useTicketHistory';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserDashboardProps {
  address: string;
}

export default function UserDashboard({ address }: UserDashboardProps) {
  const { history, isLoading: historyLoading, isError: historyError } = useTicketHistory(address);
  const { profile, isLoading: profileLoading, isError: profileError } = useUserProfile(address);

  if (profileLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading user data...</div>
      </div>
    );
  }

  if (profileError || historyError) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        <div className="text-lg">Error loading user data</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">No user data found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎟️ MegaPot User Profile
            <Badge variant="outline">{address.slice(0, 8)}...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">{profile.totalTicketsPurchased}</div>
              <div className="text-sm text-muted-foreground">Total Tickets</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{profile.totalWinnings}</div>
              <div className="text-sm text-muted-foreground">Total Winnings</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{profile.ticketPurchaseCount}</div>
              <div className="text-sm text-muted-foreground">Purchase Count</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{profile.winWithdrawalCount}</div>
              <div className="text-sm text-muted-foreground">Withdrawals</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Ticket Purchases */}
      <Card>
        <CardHeader>
          <CardTitle>🎫 Recent Ticket Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {history && history.length > 0 ? (
            <div className="space-y-3">
              {history.slice(0, 5).map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{ticket.ticketsPurchased} tickets</div>
                    <div className="text-sm text-muted-foreground">
                      Block: {ticket.blockNumber}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono">
                      {ticket.transactionHash.slice(0, 10)}...
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(parseInt(ticket.blockTimestamp) * 1000).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No ticket purchases found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Win Withdrawals */}
      {profile.winWithdrawals && profile.winWithdrawals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>💰 Win Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.winWithdrawals.slice(0, 5).map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{withdrawal.amount} ETH</div>
                    <div className="text-sm text-muted-foreground">
                      {withdrawal.transactionHash.slice(0, 10)}...
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(parseInt(withdrawal.blockTimestamp) * 1000).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liquidity Provider Status */}
      {profile.isLiquidityProvider && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💧 Liquidity Provider
              <Badge>Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xl font-bold">{profile.totalLpDeposited}</div>
                <div className="text-sm text-muted-foreground">Total LP Deposited</div>
              </div>
              <div>
                <div className="text-xl font-bold">{profile.currentLpPosition}</div>
                <div className="text-sm text-muted-foreground">Current LP Position</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 