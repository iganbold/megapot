'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useState, useEffect } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { useTicketHistory } from '@/hooks/useTicketHistory';
import { useUserProfile } from '@/hooks/useUserProfile';
import jackpotAbi from '@/lib/abi/jackpotAbi';
import { config } from '@/lib/config';
import { parseUnits } from 'viem';

export default function Home() {
  const { login, logout, authenticated, user } = usePrivy();
  const { address } = useAccount();
  const [ticketCount, setTicketCount] = useState(1);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showTicketHistory, setShowTicketHistory] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [animatedPoints, setAnimatedPoints] = useState(10);
  const [isAnimating, setIsAnimating] = useState(false);
  const [purchaseStep, setPurchaseStep] = useState<'idle' | 'approving' | 'purchasing'>('idle');

  const { data: usdcBalance } = useBalance({
    address,
    token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  });

  const { history: ticketHistory, isLoading: historyLoading } = useTicketHistory(address);
  const { profile: userProfile, isLoading: profileLoading } = useUserProfile(address);

  // Smart contract interaction
  const { writeContract, data: hash, isPending: isPurchasing } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isPurchaseSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // USDC contract address on Base
  const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  const contractAddress = (config.megapotMainnetTestContractAddress || config.megapotProxyContractAddress) as `0x${string}`;

  // Check current USDC allowance
  const { data: currentAllowance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: [
      {
        "inputs": [
          {"internalType": "address", "name": "owner", "type": "address"},
          {"internalType": "address", "name": "spender", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'allowance',
    args: [address || '0x0', contractAddress],
    query: { enabled: !!address }
  });

  // Auto-progress to purchase step when approval is successful
  useEffect(() => {
    if (purchaseStep === 'approving' && isPurchaseSuccess) {
      setTimeout(() => {
        handlePurchaseTickets();
      }, 1000); // Small delay for better UX
    } else if (purchaseStep === 'purchasing' && isPurchaseSuccess) {
      setTimeout(() => {
        setPurchaseStep('idle');
      }, 2000); // Reset after success
    }
  }, [isPurchaseSuccess, purchaseStep]);

  const animatePoints = (targetPoints: number) => {
    setIsAnimating(true);
    const startPoints = animatedPoints;
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentPoints = Math.round(startPoints + (targetPoints - startPoints) * easeOut);

      setAnimatedPoints(currentPoints);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  };

  const adjustTicketCount = (amount: number) => {
    setTicketCount((prev) => {
      const newCount = Math.max(1, prev + amount);
      animatePoints(newCount * 10); // Triggers animation
      return newCount;
    });
  };

  const handlePurchaseTickets = async () => {
    if (!address || !authenticated) {
      login();
      return;
    }

    try {
      const ticketCost = parseUnits((ticketCount * 1.0).toString(), 6); // USDC has 6 decimals
      
      if (purchaseStep === 'idle') {
        // Check if we have sufficient allowance
        const allowance = currentAllowance || 0n;
        
        if (allowance >= ticketCost) {
          // Skip approval, go directly to purchase
          setPurchaseStep('purchasing');
          writeContract({
            address: contractAddress,
            abi: jackpotAbi,
            functionName: 'purchaseTickets',
            args: [
              '0x0000000000000000000000000000000000000000', // referrer (zero address for no referrer)
              ticketCost, // value (total cost in USDC)
              address, // recipient (buying for self)
            ],
          });
        } else {
          // Need approval first
          setPurchaseStep('approving');
          writeContract({
            address: USDC_ADDRESS as `0x${string}`,
            abi: [
              {
                "inputs": [
                  {"internalType": "address", "name": "spender", "type": "address"},
                  {"internalType": "uint256", "name": "amount", "type": "uint256"}
                ],
                "name": "approve",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function"
              }
            ],
            functionName: 'approve',
            args: [contractAddress, ticketCost],
          });
        }
      } else if (purchaseStep === 'approving' && isPurchaseSuccess) {
        // Step 2: Purchase tickets after approval is confirmed
        setPurchaseStep('purchasing');
        writeContract({
          address: contractAddress,
          abi: jackpotAbi,
          functionName: 'purchaseTickets',
          args: [
            '0x0000000000000000000000000000000000000000', // referrer (zero address for no referrer)
            ticketCost, // value (total cost in USDC)
            address, // recipient (buying for self)
          ],
        });
      }
      
    } catch (error) {
      console.error('Error purchasing tickets:', error);
      setPurchaseStep('idle');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a', color: '#ffffff' }}>
      {/* Mobile Container */}
      <div className="max-w-[28rem] mx-auto min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 pt-12">
          <h1 className="text-2xl font-extrabold text-white">MEGAPOT</h1>
          {!authenticated ? (
            <Button 
              onClick={login}
              className="text-sm hover:scale-105 transition-transform"
              style={{ 
                backgroundColor: '#44b626', 
                color: '#000000', 
                fontWeight: 'bold',
                padding: '0.5rem 1.5rem',
                borderRadius: '0.75rem'
              }}
            >
              Connect Wallet
            </Button>
          ) : (
            <Button 
              onClick={logout}
              className="text-sm hover:bg-opacity-80 focus:ring-0 focus:outline-none flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(42, 42, 42, 0.8)',
                color: '#ffffff',
                border: '1px solid rgba(68, 182, 38, 0.3)',
                borderRadius: '1.5rem',
                boxShadow: 'none',
                fontWeight: 'normal',
                padding: '0.5rem 1rem'
              }}
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#44b626' }}
              ></div>
              {user?.wallet?.address ? 
                `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` :
                user?.email?.address || 'Connected'
              }
            </Button>
          )}
        </div>

        {/* Main Content */}
        <div className="px-6 space-y-6">
          {/* Jackpot Display */}
          <Card 
            className="p-7"
            style={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: '1.25rem',
              boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.4), 0 8px 24px -4px rgba(0, 0, 0, 0.3)',
              border: 'none'
            }}
          >
            <div className="text-center">
              <p className="text-sm font-medium tracking-wide mb-2" style={{ color: '#a1a1aa' }}>
                TODAY&apos;S JACKPOT
              </p>
              <div className="text-6xl font-black text-white mb-2">
                $1,036,062
              </div>
              <p className="text-sm" style={{ color: '#a1a1aa' }}>
                Drawing tomorrow at 11:01 AM
              </p>
            </div>
          </Card>

          {/* Buy Tickets Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Buy tickets</h2>
            
            <Card 
              className="p-7"
              style={{ 
                backgroundColor: '#1a1a1a', 
                borderRadius: '1.25rem',
                boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.4), 0 8px 24px -4px rgba(0, 0, 0, 0.3)',
                border: 'none'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <input
                  type="number"
                  value={ticketCount}
                  onChange={(e) => {
                    const newCount = Math.max(1, parseInt(e.target.value) || 1);
                    setTicketCount(newCount);
                    animatePoints(newCount * 10);
                  }}
                  className="text-6xl font-black text-white bg-transparent border-none outline-none w-32 ticket-input"
                  placeholder="1"
                  min="1"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={() => adjustTicketCount(1)}
                    className="px-4 py-2 text-sm hover:bg-opacity-80 focus:ring-0 focus:outline-none"
                    style={{
                      backgroundColor: '#2a2a2a',
                      color: '#ffffff',
                      border: '1px solid #2a2a2a',
                      borderRadius: '0.75rem',
                      boxShadow: 'none'
                    }}
                  >
                    +1
                  </Button>
                  <Button 
                    onClick={() => adjustTicketCount(10)}
                    className="px-4 py-2 text-sm hover:bg-opacity-80 focus:ring-0 focus:outline-none"
                    style={{
                      backgroundColor: '#2a2a2a',
                      color: '#ffffff',
                      border: '1px solid #2a2a2a',
                      borderRadius: '0.75rem',
                      boxShadow: 'none'
                    }}
                  >
                    +10
                  </Button>
                  <Button 
                    onClick={() => adjustTicketCount(100)}
                    className="px-4 py-2 text-sm hover:bg-opacity-80 focus:ring-0 focus:outline-none"
                    style={{
                      backgroundColor: '#2a2a2a',
                      color: '#ffffff',
                      border: '1px solid #2a2a2a',
                      borderRadius: '0.75rem',
                      boxShadow: 'none'
                    }}
                  >
                    +100
                  </Button>
                </div>
              </div>
              
              <p className="text-sm" style={{ color: '#a1a1aa' }}>
                Balance: {usdcBalance ? `${parseFloat(usdcBalance.formatted).toFixed(2)}` : '0.00'} USDC
              </p>
            </Card>
          </div>

          {/* Megapoints Section */}
          <Card 
            className="p-7"
            style={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: '1.25rem',
              boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.4), 0 8px 24px -4px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(68, 182, 38, 0.2)',
              background: 'linear-gradient(to right, rgba(68, 182, 38, 0.1), rgba(116, 192, 252, 0.1))'
            }}
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <img 
                src="/point.png"
                alt="Points"
                className={`w-12 h-12 transition-transform duration-200 ${
                  isAnimating ? 'animate-bounce' : ''
                }`}
              />
              <div className="text-left">
                <h3 className="font-bold text-lg mb-1" style={{ color: '#44b626' }}>Earn Megapoints!</h3>
                <p className="text-white text-sm">10 points per ticket</p>
              </div>
            </div>
            
            <div 
              className="p-4 rounded-xl mb-4"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-white text-sm">Your tickets:</span>
                <span className="text-white font-bold text-2xl">
                  {ticketCount}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">Points earned:</span>
                <span 
                  className={`font-bold text-2xl transition-all duration-300 ${
                    isAnimating ? 'scale-125 animate-pulse' : ''
                  }`}
                  style={{ color: '#44b626' }}
                >
                  +{animatedPoints}
                </span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm mb-2" style={{ color: '#a1a1aa' }}>
                🎁 Redeem points for:
              </div>
              <div className="text-sm" style={{ color: '#a1a1aa' }}>
                Free tickets • Bonus entries • Exclusive rewards
              </div>
            </div>
          </Card>



          {/* Buy Button */}
          <Button 
            variant="primary"
            className="w-full text-lg"
            style={{ 
              padding: '1.75rem 2rem',
              borderRadius: '1.25rem'
            }}
            onClick={handlePurchaseTickets}
            disabled={isPurchasing || isConfirming || purchaseStep !== 'idle'}
          >
            {purchaseStep === 'approving' && isPurchasing ? 'Approve USDC...' : 
             purchaseStep === 'approving' && isConfirming ? 'Confirming Approval...' : 
             purchaseStep === 'purchasing' && isPurchasing ? 'Purchasing...' : 
             purchaseStep === 'purchasing' && isConfirming ? 'Confirming Purchase...' : 
             isPurchaseSuccess && purchaseStep === 'purchasing' ? '✅ Success!' : 
             'Buy tickets'}
          </Button>

          {/* My Ticket History */}
          {authenticated && (
            <Card 
              className="p-0 overflow-hidden"
              style={{ 
                backgroundColor: '#1a1a1a', 
                borderRadius: '1.25rem',
                boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.4), 0 8px 24px -4px rgba(0, 0, 0, 0.3)',
                border: 'none'
              }}
            >
              <Button
                onClick={() => setShowTicketHistory(!showTicketHistory)}
                className="w-full bg-transparent border-none text-white font-medium flex items-center justify-between hover:bg-muted/50"
                style={{ 
                  backgroundColor: 'transparent',
                  padding: '1.75rem 2rem',
                  borderRadius: '1.25rem'
                }}
              >
                <span className="text-lg font-bold">My Ticket History</span>
                <ChevronDownIcon 
                  className={`w-5 h-5 transition-transform ${showTicketHistory ? 'rotate-180' : ''}`} 
                />
              </Button>
              
              {showTicketHistory && (
                <div className="px-6 pb-6">
                  {historyLoading || profileLoading ? (
                    <div className="text-center py-4" style={{ color: '#a1a1aa' }}>
                      Loading ticket history...
                    </div>
                  ) : userProfile && ticketHistory && ticketHistory.length > 0 ? (
                    <div className="space-y-6">
                      {/* Stats Header */}
                      <div className="grid grid-cols-2 gap-4">
                        <div 
                          className="p-4 rounded-xl"
                          style={{ backgroundColor: 'rgba(68, 182, 38, 0.1)' }}
                        >
                          <div className="text-sm" style={{ color: '#a1a1aa' }}>Total Tickets</div>
                          <div className="text-xl font-bold text-white">
                            {parseInt(userProfile.totalTicketsPurchased).toLocaleString()}
                          </div>
                          <div className="text-xs" style={{ color: '#44b626' }}>
                            {userProfile.ticketPurchaseCount} transactions
                          </div>
                        </div>
                        
                        <div 
                          className="p-4 rounded-xl"
                          style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)' }}
                        >
                          <div className="text-sm" style={{ color: '#a1a1aa' }}>Total Winnings</div>
                          <div className="text-xl font-bold text-white">
                            ${parseFloat(userProfile.totalWinnings || '0').toFixed(2)}
                          </div>
                          <div className="text-xs" style={{ color: '#ffc107' }}>
                            {userProfile.winWithdrawalCount} withdrawals
                          </div>
                        </div>
                        
                        <div 
                          className="p-4 rounded-xl"
                          style={{ backgroundColor: 'rgba(116, 192, 252, 0.1)' }}
                        >
                          <div className="text-sm" style={{ color: '#a1a1aa' }}>Member Since</div>
                          <div className="text-sm font-bold text-white">
                            {new Date(parseInt(userProfile.firstActivityTime) * 1000).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-xs" style={{ color: '#74C0FC' }}>
                            {userProfile.activityCount} activities
                          </div>
                        </div>
                        
                        <div 
                          className="p-4 rounded-xl"
                          style={{ backgroundColor: 'rgba(183, 148, 246, 0.1)' }}
                        >
                          <div className="text-sm" style={{ color: '#a1a1aa' }}>Total Spent</div>
                          <div className="text-xl font-bold text-white">
                            ${parseInt(userProfile.totalTicketsPurchased).toFixed(2)}
                          </div>
                          <div className="text-xs" style={{ color: '#B794F6' }}>
                            $1.00 per ticket
                          </div>
                        </div>
                      </div>
                      
                      {/* Transaction History */}
                    <div className="space-y-4">
                      {ticketHistory
                        .sort((a, b) => parseInt(b.blockTimestamp) - parseInt(a.blockTimestamp))
                        .slice(0, showAllHistory ? ticketHistory.length : 10)
                        .map((ticket, index) => {
                        const ticketDate = new Date(parseInt(ticket.blockTimestamp) * 1000);
                        const ticketsCount = parseInt(ticket.ticketsPurchased);
                        const pointsEarned = ticketsCount * 10;
                        const usdcSpent = ticketsCount * 1.0; // $1 per ticket
                        
                        return (
                          <div key={ticket.id} className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white font-bold">
                                      {ticket.transactionHash.slice(0, 6)}...{ticket.transactionHash.slice(-4)}
                                    </span>
                                    <span 
                                      className="px-2 py-1 rounded-full text-xs font-medium"
                                      style={{
                                        backgroundColor: 'rgba(68, 182, 38, 0.2)',
                                        color: '#44b626'
                                      }}
                                    >
                                      Completed
                                    </span>
                                  </div>
                                  <div className="text-sm" style={{ color: '#a1a1aa' }}>
                                    {ticketDate.toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: '2-digit', 
                                      day: '2-digit' 
                                    })} at {ticketDate.toLocaleTimeString('en-US', { 
                                      hour: 'numeric', 
                                      minute: '2-digit', 
                                      hour12: true 
                                    })}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-white font-bold">{ticketsCount} ticket{ticketsCount > 1 ? 's' : ''}</div>
                                <div className="text-sm" style={{ color: '#a1a1aa' }}>
                                  {usdcSpent.toFixed(2)} USDC
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-sm" style={{ color: '#a1a1aa' }}>
                                Block: #{ticket.blockNumber}
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <img src="/point.png" alt="Points" className="w-4 h-4" />
                                  <span className="text-sm font-medium" style={{ color: '#44b626' }}>
                                    +{pointsEarned}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {index < Math.min(ticketHistory.length - 1, showAllHistory ? ticketHistory.length - 1 : 9) && (
                              <div 
                                className="h-px w-full"
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                              />
                            )}
                          </div>
                        );
                      })}
                      
                      {ticketHistory.length > 10 && (
                        <div className="pt-4">
                          <Button 
                            onClick={() => setShowAllHistory(!showAllHistory)}
                            className="w-full text-sm font-medium py-3"
                            style={{ 
                              backgroundColor: 'transparent',
                              color: '#44b626',
                              border: '1px solid rgba(68, 182, 38, 0.3)',
                              borderRadius: '0.75rem'
                            }}
                          >
                            {showAllHistory ? 'Show Less' : 'View All History'}
                          </Button>
                        </div>
                      )}
                    </div>
                    </div>
                  ) : (
                    <div className="text-center py-8" style={{ color: '#a1a1aa' }}>
                      <div className="text-lg mb-2">No ticket history yet</div>
                      <div className="text-sm">Purchase your first tickets to see them here!</div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Footer */}
          <div className="text-center py-8">
            <p className="text-xs mb-2" style={{ color: '#a1a1aa' }}>POWERED BY</p>
            <p className="text-white font-bold text-lg">MEGAPOT</p>
          </div>

          {/* FAQ Section */}
          <div className="pb-8">
            <Button
              onClick={() => setShowFAQ(!showFAQ)}
              className="w-full bg-transparent border-none text-white font-medium p-4 flex items-center justify-between hover:bg-muted/50 rounded-xl"
              style={{ backgroundColor: 'transparent' }}
            >
              <span>What is Megapot?</span>
              <ChevronDownIcon 
                className={`w-5 h-5 transition-transform ${showFAQ ? 'rotate-180' : ''}`} 
              />
            </Button>
            
            {showFAQ && (
              <div 
                className="mt-4 p-4 rounded-xl"
                style={{ backgroundColor: 'rgba(42, 42, 42, 0.2)' }}
              >
                <p className="text-sm" style={{ color: '#a1a1aa' }}>
                  Megapot is a decentralized lottery protocol that allows users to buy tickets and earn rewards through Megapoints. Each ticket purchase earns you points that can be redeemed for free tickets and exclusive rewards.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
