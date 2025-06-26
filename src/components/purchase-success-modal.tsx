import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePrivy } from '@privy-io/react-auth';

interface PurchaseSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketCount: number;
  transactionHash?: string;
}

export function PurchaseSuccessModal({ 
  isOpen, 
  onClose, 
  ticketCount,
  transactionHash 
}: PurchaseSuccessModalProps) {
  const { user } = usePrivy();
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [showConfetti, setShowConfetti] = useState(false);

  const handleShareReferral = async () => {
    if (!user?.wallet?.address) {
      return;
    }

    const baseUrl = window.location.origin;
    const referralUrl = `${baseUrl}?ref=${user.wallet.address}`;
    
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy referral link:', error);
    }
  };

  // Trigger confetti when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Points Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-60">
          <style jsx>{`
            @keyframes fallAndBounce {
              0% {
                transform: translateY(-20px) translateX(-50%) rotate(0deg);
                opacity: 1;
              }
              70% {
                transform: translateY(100vh) translateX(-50%) rotate(360deg);
                opacity: 1;
              }
              100% {
                transform: translateY(100vh) translateX(-50%) rotate(360deg);
                opacity: 0;
              }
            }
            .falling-points {
              animation: fallAndBounce 3s ease-in forwards;
            }
          `}</style>
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="absolute falling-points"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-40px',
                animationDelay: `${Math.random() * 1.5}s`,
                animationDuration: `${2.5 + Math.random() * 1.5}s`,
              }}
            >
              <img 
                src="/point.png" 
                alt="P" 
                className="w-8 h-8"
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm mx-4">
        <Card 
          className="p-6"
          style={{ 
            backgroundColor: '#1a1a1a', 
            borderRadius: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Success Icon */}
          <div className="flex justify-center mb-4">
            <img 
              src="/point.png" 
              alt="Points" 
              className="w-16 h-16"
            />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white text-center mb-3">
            Congratulations!
          </h2>

          {/* Subtitle */}
          <p className="text-center mb-6" style={{ color: '#a1a1aa' }}>
            You have successfully purchased {ticketCount} Megapot ticket{ticketCount > 1 ? 's' : ''}
          </p>

          {/* Surprise Bonus Section */}
          <div 
            className="p-4 mb-6 rounded-xl relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, rgba(68, 182, 38, 0.15) 0%, rgba(68, 182, 38, 0.05) 100%)',
              border: '1px solid rgba(68, 182, 38, 0.2)'
            }}
          >
            {/* Header */}
            <div className="text-center mb-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-2xl">🎁</span>
                <h3 className="font-bold text-lg" style={{ color: '#44b626' }}>
                  Daily Bonus
                </h3>
              </div>
              <p className="text-xs" style={{ color: '#a1a1aa' }}>
                $100 in daily prizes • Automatic entry with every ticket
              </p>
            </div>

            {/* Prize Display */}
            <div className="flex items-end justify-center gap-4 mb-3">
              {/* Gold Medal - $25 */}
              <div className="text-center">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-2 mx-auto"
                  style={{ 
                    background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                    boxShadow: '0 6px 16px rgba(255, 215, 0, 0.4)',
                    border: '2px solid #ffed4e'
                  }}
                >
                  <span className="text-lg font-bold text-black">$25</span>
                </div>
                <p className="text-xs font-medium" style={{ color: '#ffd700' }}>1 winner</p>
              </div>
              
              {/* Silver Medal - $5 */}
              <div className="text-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-2 mx-auto"
                  style={{ 
                    background: 'linear-gradient(135deg, #c0c0c0 0%, #e5e5e5 100%)',
                    boxShadow: '0 5px 14px rgba(192, 192, 192, 0.4)',
                    border: '2px solid #e5e5e5'
                  }}
                >
                  <span className="text-base font-bold text-black">$5</span>
                </div>
                <p className="text-xs font-medium" style={{ color: '#c0c0c0' }}>5 winners</p>
              </div>
              
              {/* Bronze Medal - $2 */}
              <div className="text-center">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto"
                  style={{ 
                    background: 'linear-gradient(135deg, #cd7f32 0%, #daa520 100%)',
                    boxShadow: '0 4px 12px rgba(205, 127, 50, 0.4)',
                    border: '2px solid #daa520'
                  }}
                >
                  <span className="text-sm font-bold text-white">$2</span>
                </div>
                <p className="text-xs font-medium" style={{ color: '#cd7f32' }}>25 winners</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs font-medium" style={{ color: '#44b626' }}>
                ✨ Winners announced after each draw
              </p>
            </div>
          </div>

          {/* What's Next Section */}
          <div className="mb-5">
            <h3 className="text-base font-bold text-white mb-3">What&apos;s Next:</h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#44b626' }}
                >
                  <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs" style={{ color: '#a1a1aa' }}>
                  Wait for tomorrow&apos;s $1M+ jackpot draw
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#44b626' }}
                >
                  <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-xs" style={{ color: '#a1a1aa' }}>
                  Check for daily bonus prize wins (up to $25!)
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Link */}
          {transactionHash && (
            <div className="flex items-center justify-between mb-4 p-2 rounded-lg" style={{ backgroundColor: 'rgba(42, 42, 42, 0.5)' }}>
              <span className="text-xs" style={{ color: '#a1a1aa' }}>
                Transaction confirmed
              </span>
              <a
                href={`https://basescan.org/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: '#44b626' }}
              >
                View
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              variant="primary"
              className="w-full text-base font-bold"
              style={{ 
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem'
              }}
              onClick={onClose}
            >
              Buy more tickets
            </Button>
            
            <Button 
              className="w-full text-base font-medium"
              style={{ 
                backgroundColor: 'transparent',
                color: copyStatus === 'copied' ? '#44b626' : '#44b626',
                border: `2px solid ${copyStatus === 'copied' ? '#44b626' : '#44b626'}`,
                borderRadius: '0.75rem',
                padding: '0.75rem 1.5rem'
              }}
              onClick={handleShareReferral}
            >
              {copyStatus === 'copied' ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied to clipboard!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Copy referral link
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
} 