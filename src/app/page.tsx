'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useState, useEffect } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { useTicketHistory } from '@/hooks/useTicketHistory';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useCurrentJackpot } from '@/hooks/useCurrentJackpot';
import jackpotAbi from '@/lib/abi/jackpotAbi';
import { config } from '@/lib/config';
import { parseUnits } from 'viem';
import { PurchaseSuccessModal } from '@/components/purchase-success-modal';

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [referralAddress, setReferralAddress] = useState<string>('0x0000000000000000000000000000000000000000');
  const [liveTimeLeft, setLiveTimeLeft] = useState(0);

  const { data: usdcBalance } = useBalance({
    address,
    token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  });

  const { history: ticketHistory, isLoading: historyLoading } = useTicketHistory(address);
  const { profile: userProfile, isLoading: profileLoading } = useUserProfile(address);
  const { formattedJackpot, isLoading: jackpotLoading, timeLeft } = useCurrentJackpot();

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

  // Extract referral address from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    if (refParam && refParam.match(/^0x[a-fA-F0-9]{40}$/)) {
      // Valid Ethereum address format
      setReferralAddress(refParam);
    }
  }, []);

  // Live countdown timer
  useEffect(() => {
    setLiveTimeLeft(timeLeft); // Reset when timeLeft from hook changes
    if (timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setLiveTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Auto-progress to purchase step when approval is successful
  useEffect(() => {
    if (purchaseStep === 'approving' && isPurchaseSuccess) {
      setTimeout(() => {
        handlePurchaseTickets();
      }, 1000); // Small delay for better UX
         } else if (purchaseStep === 'purchasing' && isPurchaseSuccess) {
       setTimeout(() => {
         setPurchaseStep('idle');
         setShowSuccessModal(true);
       }, 1000); // Show success modal after purchase
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
              referralAddress, // referrer from URL params or zero address
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
            referralAddress, // referrer from URL params or zero address
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
          <div className="h-8">
            <svg 
              width="146" 
              height="32" 
              viewBox="0 0 731 162" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="h-full w-auto"
            >
              <path d="M7.168 130.5V38.34H26.752L59.008 76.868L91.136 38.34H110.848V130.5H92.288V65.86L59.008 105.668L25.6 65.988V130.5H7.168ZM126.174 130.5V38.34H211.166V56.9H144.862V75.076H198.238V93.764H144.862V111.94H211.166V130.5H126.174ZM242.35 130.5C238.937 130.5 235.822 129.689 233.006 128.068C230.275 126.361 228.057 124.143 226.35 121.412C224.729 118.596 223.918 115.481 223.918 112.068V56.772C223.918 53.3587 224.729 50.2867 226.35 47.556C228.057 44.74 230.275 42.5213 233.006 40.9C235.822 39.1933 238.937 38.34 242.35 38.34H297.518C300.931 38.34 304.003 39.1933 306.734 40.9C309.55 42.5213 311.811 44.74 313.518 47.556C315.225 50.2867 316.078 53.3587 316.078 56.772V64.708H297.39V57.668C297.39 57.412 297.305 57.2413 297.134 57.156C297.049 56.9853 296.878 56.9 296.622 56.9H243.118C242.862 56.9 242.649 56.9853 242.478 57.156C242.393 57.2413 242.35 57.412 242.35 57.668V111.172C242.35 111.428 242.393 111.641 242.478 111.812C242.649 111.897 242.862 111.94 243.118 111.94H296.622C296.878 111.94 297.049 111.897 297.134 111.812C297.305 111.641 297.39 111.428 297.39 111.172V96.068H277.038V77.508H316.078V112.068C316.078 115.481 315.225 118.596 313.518 121.412C311.811 124.143 309.55 126.361 306.734 128.068C304.003 129.689 300.931 130.5 297.518 130.5H242.35ZM330.424 130.5V56.772C330.424 53.3587 331.235 50.2867 332.856 47.556C334.563 44.74 336.781 42.5213 339.512 40.9C342.328 39.1933 345.443 38.34 348.856 38.34H404.024C407.437 38.34 410.509 39.1933 413.24 40.9C416.056 42.5213 418.317 44.74 420.024 47.556C421.731 50.2867 422.584 53.3587 422.584 56.772V130.5H403.896V100.164H348.856V130.5H330.424ZM348.856 81.732H403.896V57.668C403.896 57.412 403.811 57.2413 403.64 57.156C403.555 56.9853 403.384 56.9 403.128 56.9H349.624C349.368 56.9 349.155 56.9853 348.984 57.156C348.899 57.2413 348.856 57.412 348.856 57.668V81.732Z" fill="#44b626"/>
              <path d="M477.706 13H440.007V62.9132L452.246 62.8257L443.5 120.738C443.5 121.213 439.821 149.417 440.007 148.995L474.277 55.3881H466.255L466.203 36.8056H478.149C487.76 36.8056 495.552 45.279 495.552 55.7293C495.552 66.1807 491.065 74.653 481.454 74.653H478.981L469.754 98.5093L477.706 98.459C499.407 98.459 517 79.3285 517 55.7304C517 32.1324 499.407 13 477.706 13Z" fill="#44b626"/>
              <path d="M552.344 130.5C548.931 130.5 545.816 129.689 543 128.068C540.269 126.361 538.051 124.143 536.344 121.412C534.723 118.596 533.912 115.481 533.912 112.068V56.772C533.912 53.3587 534.723 50.2867 536.344 47.556C538.051 44.74 540.269 42.5213 543 40.9C545.816 39.1933 548.931 38.34 552.344 38.34H607.64C610.968 38.34 613.997 39.1933 616.728 40.9C619.544 42.5213 621.805 44.74 623.512 47.556C625.219 50.2867 626.072 53.3587 626.072 56.772V112.068C626.072 115.481 625.219 118.596 623.512 121.412C621.805 124.143 619.544 126.361 616.728 128.068C613.997 129.689 610.968 130.5 607.64 130.5H552.344ZM553.112 111.94H606.616C606.872 111.94 607.043 111.897 607.128 111.812C607.299 111.641 607.384 111.428 607.384 111.172V57.668C607.384 57.412 607.299 57.2413 607.128 57.156C607.043 56.9853 606.872 56.9 606.616 56.9H553.112C552.856 56.9 552.643 56.9853 552.472 57.156C552.387 57.2413 552.344 57.412 552.344 57.668V111.172C552.344 111.428 552.387 111.641 552.472 111.812C552.643 111.897 552.856 111.94 553.112 111.94ZM672.424 130.5V56.9H635.56V38.34H727.72V56.9H690.984V130.5H672.424Z" fill="#44b626"/>
            </svg>
          </div>
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
            className="p-6"
            style={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: '1.25rem',
              boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.4), 0 8px 24px -4px rgba(0, 0, 0, 0.3)',
              border: 'none'
            }}
          >
            <div className="text-center">
              <p className="text-sm font-medium tracking-wide mb-3 uppercase" style={{ color: '#a1a1aa' }}>
                Today&apos;s Jackpot
              </p>
              <div className="text-5xl md:text-6xl font-black text-white mb-3 leading-none">
                {jackpotLoading ? '$0' : `$${Math.floor(parseFloat(formattedJackpot)).toLocaleString()}`}
              </div>
              <p className="text-sm" style={{ color: '#a1a1aa' }}>
                {liveTimeLeft > 0 
                  ? `Drawing in ${Math.floor(liveTimeLeft / 3600)}h ${Math.floor((liveTimeLeft % 3600) / 60)}m ${liveTimeLeft % 60}s`
                  : 'Drawing starting soon'
                }
              </p>
            </div>
          </Card>

          {/* Buy Tickets Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Buy tickets</h2>
            
            <Card 
              className="p-6"
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
                  className="text-5xl md:text-6xl font-black text-white bg-transparent border-none outline-none w-28 md:w-32 ticket-input"
                  placeholder="1"
                  min="1"
                />
                <div className="flex gap-2 flex-shrink-0">
                  <Button 
                    onClick={() => adjustTicketCount(1)}
                    className="px-3 py-2 text-sm hover:bg-opacity-80 focus:ring-0 focus:outline-none"
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
                    className="px-3 py-2 text-sm hover:bg-opacity-80 focus:ring-0 focus:outline-none"
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
                    className="px-3 py-2 text-sm hover:bg-opacity-80 focus:ring-0 focus:outline-none"
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
              
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white mb-1">Price</p>
                  <p className="text-lg font-bold text-white">$1 <span className="text-sm font-normal" style={{ color: '#a1a1aa' }}>per ticket</span></p>
                </div>
                <div className="text-right">
                  <p className="text-sm mb-1" style={{ color: '#a1a1aa' }}>Balance</p>
                  <p className="text-sm font-medium text-white">
                    {usdcBalance ? `${parseFloat(usdcBalance.formatted).toFixed(2)}` : '0.00'} USDC
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Megapoints Section */}
          <Card 
            className="p-5"
            style={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: '1.25rem',
              boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.4), 0 8px 24px -4px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(68, 182, 38, 0.2)',
              background: 'linear-gradient(to right, rgba(68, 182, 38, 0.1), rgba(116, 192, 252, 0.1))'
            }}
          >
            <div className="flex items-center justify-start gap-3 mb-4">
              <img 
                src="/point.png"
                alt="Points"
                className={`w-10 h-10 flex-shrink-0 transition-transform duration-200 ${
                  isAnimating ? 'animate-bounce' : ''
                }`}
              />
              <div className="flex-1">
                <h3 className="font-bold text-base mb-0.5 leading-tight" style={{ color: '#44b626' }}>
                  Earn Megapoints!
                </h3>
                <p className="text-white text-xs leading-tight opacity-90">10 points per ticket</p>
              </div>
            </div>
            
            <div 
              className="p-3 rounded-lg mb-4"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-xs">Your tickets:</span>
                <span className="text-white font-bold text-xl">
                  {ticketCount}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white text-xs">Points earned:</span>
                <span 
                  className={`font-bold text-xl transition-all duration-300 ${
                    isAnimating ? 'scale-125 animate-pulse' : ''
                  }`}
                  style={{ color: '#44b626' }}
                >
                  +{animatedPoints}
                </span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs" style={{ color: '#a1a1aa' }}>
                🎁 Redeem for free tickets • bonus entries • exclusive rewards
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



          {/* FAQ Section */}
          <Card 
            className="p-0 overflow-hidden mb-8"
            style={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: '1.25rem',
              boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.4), 0 8px 24px -4px rgba(0, 0, 0, 0.3)',
              border: 'none'
            }}
          >
            <Button
              onClick={() => setShowFAQ(!showFAQ)}
              className="w-full bg-transparent border-none text-white font-medium flex items-center justify-between hover:bg-muted/50"
              style={{ 
                backgroundColor: 'transparent',
                padding: '1.75rem 2rem',
                borderRadius: '1.25rem'
              }}
            >
              <span className="text-lg font-bold">Frequently Asked Questions</span>
              <ChevronDownIcon 
                className={`w-5 h-5 transition-transform ${showFAQ ? 'rotate-180' : ''}`} 
              />
            </Button>
            
            {showFAQ && (
              <div className="px-6 pb-6 space-y-6">
                
                {/* What is Megapot */}
                <div>
                  <h3 className="font-bold text-white mb-2">What is Megapot?</h3>
                  <p className="text-sm" style={{ color: '#a1a1aa' }}>
                    Megapot runs a daily jackpot online with a huge cash prize. Drawings are independently audited for security and anyone can confirm the results are fair.
                  </p>
                </div>
                
                <div className="h-px w-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                
                {/* Prizes and Odds */}
                <div>
                  <h3 className="font-bold text-white mb-2">What are the prizes and odds?</h3>
                  <div className="text-sm space-y-2" style={{ color: '#a1a1aa' }}>
                    <p>Our prizes include the $1,036,432.93 jackpot. Odds to win are 1 in 1,480,618, which are 197x better than the USA lottery (Powerball).</p>
                    <p>Each ticket also has a chance to win 1 of 31 guaranteed daily prizes up to $25. Odds are based on how many players play.</p>
                    <p>All prizes are in USDC, a regulated and fully-backed digital dollar.</p>
                  </div>
                </div>
                
                <div className="h-px w-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                
                {/* Fair Drawing */}
                <div>
                  <h3 className="font-bold text-white mb-2">How do I know the drawing is fair?</h3>
                  <div className="text-sm space-y-2" style={{ color: '#a1a1aa' }}>
                    <p>19 players have won the jackpot and over $60 million of jackpots have run since July 2024, all publicly verifiable on the blockchain.</p>
                    <p>Our code uses an external random number generator and has been audited 4 times by top security firms.</p>
                    <p>We have been featured in Forbes, a major US magazine. Our founder previously worked at Uniswap and Microsoft.</p>
                  </div>
                </div>
                
                <div className="h-px w-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                
                {/* Claim Winnings */}
                <div>
                  <h3 className="font-bold text-white mb-2">How do I claim my winnings?</h3>
                  <p className="text-sm" style={{ color: '#a1a1aa' }}>
                    Winnings can be withdrawn immediately. Since the code runs by itself on the blockchain, Megapot does not hold your tickets or your winnings at any time.
                  </p>
                </div>
                
                <div className="h-px w-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                
                {/* Different from lotteries */}
                <div>
                  <h3 className="font-bold text-white mb-2">How is this different from lotteries?</h3>
                  <p className="text-sm" style={{ color: '#a1a1aa' }}>
                    Megapot can be played online from most countries, has far better expected value than any traditional lottery, and 100% of ticket cost goes to the community.
                  </p>
                </div>
                
                <div className="h-px w-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                
                {/* Fees */}
                <div>
                  <h3 className="font-bold text-white mb-2">What fees are there?</h3>
                  <div className="text-sm space-y-2" style={{ color: '#a1a1aa' }}>
                    <p>100% of your ticket cost goes to the prize pool and the community. Megapot takes 0%.</p>
                    <p>70% of the ticket cost is entered into the jackpot. 30% is paid to the community for building a mega jackpot and referring players.</p>
                  </div>
                </div>
                
                <div className="h-px w-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                
                {/* Megapoints */}
                <div>
                  <h3 className="font-bold text-white mb-2">What are Megapoints?</h3>
                  <p className="text-sm" style={{ color: '#a1a1aa' }}>
                    Megapoints are how we keep track of our earliest users. Play consecutive days and earn up to 2.5x Megapoints!
                  </p>
                </div>
                
                <div className="h-px w-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                
                {/* Big Jackpot */}
                <div>
                  <h3 className="font-bold text-white mb-2">How is this jackpot so big?</h3>
                  <div className="text-sm space-y-2" style={{ color: '#a1a1aa' }}>
                    <p>Liquidity providers (LPs) guarantee daily drawings with mega jackpots no matter how many tickets are bought by players.</p>
                    <p>If a player wins, LPs pay the prize. Otherwise, the jackpot rolls over to the next day, growing by that day&apos;s entries minus fees paid to LPs.</p>
                    <p>Become a LP and earn fees for taking on risk. More details in our docs.</p>
                  </div>
                </div>
                
                <div className="h-px w-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                
                {/* Security */}
                <div>
                  <h3 className="font-bold text-white mb-2">Secured by the Best</h3>
                  <div className="text-sm space-y-2" style={{ color: '#a1a1aa' }}>
                    <p>Our smart contract was audited 4 times by Cantina, a top security firm trusted by Coinbase and Uniswap, and CD Security, a Polygon Labs partner.</p>
                    <p>Jackpot drawings are provably random through Pyth Entropy. Pyth secures over $7B in assets.</p>
                  </div>
                </div>
                
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Purchase Success Modal */}
      <PurchaseSuccessModal 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        ticketCount={ticketCount}
        transactionHash={hash}
      />
    </div>
  );
}
