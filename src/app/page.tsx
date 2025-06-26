'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTicketHistory } from '@/hooks/useTicketHistory';
import { useState } from 'react';
import JackpotStats from '@/components/jackpot-stats';

export default function Home() {
  const { login, logout, authenticated, user } = usePrivy();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  const [searchAddress, setSearchAddress] = useState('');
  const [lookupAddress, setLookupAddress] = useState('');
  
  const { data: balance } = useBalance({
    address,
  });

  const isOnBase = chainId === base.id;

  // Load current user's profile and history
  const { profile: userProfile, isLoading: userProfileLoading } = useUserProfile(address);
  const { history: userHistory, isLoading: userHistoryLoading } = useTicketHistory(address);

  // Load searched address profile and history
  const { profile: searchProfile, isLoading: searchProfileLoading } = useUserProfile(lookupAddress);
  const { history: searchHistory, isLoading: searchHistoryLoading } = useTicketHistory(lookupAddress);

  const handleSearch = () => {
    if (searchAddress.trim()) {
      setLookupAddress(searchAddress.toLowerCase());
    }
  };

  const clearSearch = () => {
    setSearchAddress('');
    setLookupAddress('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">MegaPot Web3</h1>
        <p className="text-muted-foreground">
          Connect your wallet to get started on Base
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium">Base Mainnet Only</span>
        </div>
      </div>

      {/* Jackpot Stats Card */}
      <JackpotStats />

      <div className="flex flex-col items-center gap-4">
        {!authenticated ? (
          <Button onClick={login} size="lg">
            Connect Wallet
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Connected as:</p>
              <p className="font-mono text-sm">
                {user?.wallet?.address || user?.email?.address}
              </p>
            </div>
            <Button onClick={logout} variant="outline">
              Disconnect
            </Button>
          </div>
        )}
      </div>

      {/* Address Search */}
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🔍 Search MegaPot Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter wallet address (0x...)"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              <Button onClick={handleSearch} size="sm">
                Search
              </Button>
            </div>
            {lookupAddress && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Searching: {lookupAddress.slice(0, 8)}...{lookupAddress.slice(-6)}
                </span>
                <Button onClick={clearSearch} variant="outline" size="sm">
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {authenticated && isConnected && (
        <div className="mt-8 space-y-4 max-w-4xl w-full">
          {/* Network Status */}
          {!isOnBase && (
            <div className="p-4 border border-destructive rounded-lg bg-destructive/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-destructive">Wrong Network</h3>
                  <p className="text-sm text-muted-foreground">Please switch to Base</p>
                </div>
                <Button 
                  size="sm"
                  onClick={() => switchChain({ chainId: base.id })}
                >
                  Switch to Base
                </Button>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Current User Profile */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Your Profile</h2>
              
              {/* Wallet Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💳 Wallet Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Address:</span> {address}</p>
                    <p><span className="font-medium">Network:</span> {isOnBase ? 'Base Mainnet' : `Chain ${chainId}`}</p>
                    {balance && isOnBase && (
                      <p><span className="font-medium">Balance:</span> {parseFloat(balance.formatted).toFixed(4)} ETH</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* User MegaPot Profile */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🎟️ Your MegaPot Stats
                    {userProfileLoading && <Badge variant="outline">Loading...</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userProfile ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-lg font-bold">{userProfile.totalTicketsPurchased}</div>
                        <div className="text-xs text-muted-foreground">Total Tickets</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{userProfile.totalWinnings}</div>
                        <div className="text-xs text-muted-foreground">Total Winnings</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{userProfile.ticketPurchaseCount}</div>
                        <div className="text-xs text-muted-foreground">Purchases</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{userProfile.winWithdrawalCount}</div>
                        <div className="text-xs text-muted-foreground">Withdrawals</div>
                      </div>
                    </div>
                  ) : userProfileLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading profile...</div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No MegaPot activity found</div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Tickets */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🎫 Recent Tickets
                    {userHistoryLoading && <Badge variant="outline">Loading...</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userHistory && userHistory.length > 0 ? (
                    <div className="space-y-2">
                      {userHistory.slice(0, 3).map((ticket) => (
                        <div key={ticket.id} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <div className="font-medium">{ticket.ticketsPurchased} tickets</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(parseInt(ticket.blockTimestamp) * 1000).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-xs font-mono">
                            {ticket.transactionHash.slice(0, 8)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : userHistoryLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading history...</div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No ticket purchases found</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Searched Address Profile */}
            {lookupAddress && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Search Results</h2>
                
                {/* Searched Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      🔍 Profile: {lookupAddress.slice(0, 8)}...
                      {searchProfileLoading && <Badge variant="outline">Loading...</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {searchProfile ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-lg font-bold">{searchProfile.totalTicketsPurchased}</div>
                          <div className="text-xs text-muted-foreground">Total Tickets</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{searchProfile.totalWinnings}</div>
                          <div className="text-xs text-muted-foreground">Total Winnings</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{searchProfile.ticketPurchaseCount}</div>
                          <div className="text-xs text-muted-foreground">Purchases</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{searchProfile.winWithdrawalCount}</div>
                          <div className="text-xs text-muted-foreground">Withdrawals</div>
                        </div>
                        {searchProfile.isLiquidityProvider && (
                          <div className="col-span-2">
                            <Badge>💧 Liquidity Provider</Badge>
                          </div>
                        )}
                      </div>
                    ) : searchProfileLoading ? (
                      <div className="text-center py-4 text-muted-foreground">Loading profile...</div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">No MegaPot activity found</div>
                    )}
                  </CardContent>
                </Card>

                {/* Searched History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      🎫 Recent Activity
                      {searchHistoryLoading && <Badge variant="outline">Loading...</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {searchHistory && searchHistory.length > 0 ? (
                      <div className="space-y-2">
                        {searchHistory.slice(0, 5).map((ticket) => (
                          <div key={ticket.id} className="flex justify-between items-center p-2 border rounded">
                            <div>
                              <div className="font-medium">{ticket.ticketsPurchased} tickets</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(parseInt(ticket.blockTimestamp) * 1000).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-xs font-mono">
                              {ticket.transactionHash.slice(0, 8)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : searchHistoryLoading ? (
                      <div className="text-center py-4 text-muted-foreground">Loading history...</div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">No ticket purchases found</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {authenticated && !isConnected && (
        <div className="mt-8 p-6 border rounded-lg space-y-2 max-w-md">
          <h3 className="font-semibold">Email Account:</h3>
          <div className="text-sm space-y-1">
            <p>You&apos;re signed in with email. To use web3 features, connect a wallet.</p>
            <Button onClick={login} size="sm" className="mt-2">
              Connect Wallet
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
