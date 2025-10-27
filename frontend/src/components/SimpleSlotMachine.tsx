import React, { useState, useEffect } from 'react';
import { useFHELuckySpinSimplified } from '@/hooks/useFHELuckySpinSimplified';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Gift, Trophy, RotateCcw, History } from 'lucide-react';
import { useAccount } from 'wagmi';
import { PRIZE_INFO, CONTRACT_ADDRESSES } from '@/config/contracts';

const PRIZE_EMOJIS = ['🙏', '💎', '⭐', '💰', '🎁'];

interface Prize {
  name: string;
  value: string;
  probability: number;
}

export function SimpleSlotMachine() {
  const { address } = useAccount();
  const {
    remainingSpins,
    userSpinCount,
    spin,
    selectedPrize,
    isEncrypting,
    isWritePending,
    isConfirming,
    isConfirmed,
    hash: txHash,
  } = useFHELuckySpinSimplified();

  // Use prizes from config
  const prizes: Prize[] = PRIZE_INFO.map(p => ({
    name: p.name,
    value: p.value,
    probability: p.probability,
  }));

  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<{ prize: Prize; index: number } | null>(null);
  const [reels, setReels] = useState<number[]>([0, 0, 0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [winHistory, setWinHistory] = useState<Array<{ prize: Prize; index: number; timestamp: number }>>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Watch for transaction confirmation
  useEffect(() => {
    if (isConfirmed && selectedPrize !== null && prizes[selectedPrize]) {
      // Show success modal after a short delay
      setTimeout(() => {
        setShowSuccessModal(true);

        // Set final result
        setReels([selectedPrize, selectedPrize, selectedPrize]);
        const resultData = {
          prize: prizes[selectedPrize],
          index: selectedPrize,
          timestamp: Date.now(),
        };
        setLastResult(resultData);

        // Add to history
        setWinHistory(prev => [resultData, ...prev].slice(0, 10));
      }, 1000);
    }
  }, [isConfirmed, selectedPrize, prizes]);

  // Reel animation
  const animateReels = () => {
    setIsAnimating(true);
    let animationCount = 0;
    const maxAnimations = 20;

    const interval = setInterval(() => {
      setReels([
        Math.floor(Math.random() * 5),
        Math.floor(Math.random() * 5),
        Math.floor(Math.random() * 5)
      ]);

      animationCount++;
      if (animationCount >= maxAnimations) {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, 100);
  };

  // Handle spin
  const handleSpin = async () => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    if (remainingSpins <= 0) {
      alert('Daily spin limit reached!');
      return;
    }

    try {
      setIsSpinning(true);
      animateReels();
      await spin();
    } catch (error) {
      console.error('Spin failed:', error);
      alert('Spin failed, please try again');
      setIsSpinning(false);
    }
  };

  const isLoading = isEncrypting || isWritePending || isConfirming || isSpinning;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gradient bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🎰 FHE Lucky Spin
        </h1>
        <p className="text-gray-600 mt-2">Privacy-Preserving Blockchain Game</p>
        <p className="text-sm text-gray-500 mt-1">
          Contract: {CONTRACT_ADDRESSES.SimpleFHELuckySpin.slice(0, 6)}...{CONTRACT_ADDRESSES.SimpleFHELuckySpin.slice(-4)}
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Spins Left</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{remainingSpins}</div>
            <p className="text-xs text-gray-500">Remaining spins today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{userSpinCount}</div>
            <p className="text-xs text-gray-500">Lifetime spin count</p>
          </CardContent>
        </Card>

      </div>

      {/* Slot Machine */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle>🎰 Spin to Win</CardTitle>
          <CardDescription>
            0.01 ETH per spin • Results secured with FHE encryption
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reels Display */}
          <div className="flex justify-center items-center space-x-4">
            {reels.map((reelValue, idx) => (
              <div key={idx} className="relative">
                <div className={`w-20 h-20 rounded-lg border-4 border-yellow-400 bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center text-4xl transition-all duration-300 ${
                  isAnimating ? 'animate-pulse' : ''
                }`}>
                  {PRIZE_EMOJIS[reelValue]}
                </div>
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-yellow-600"></div>
              </div>
            ))}
          </div>

          {/* Spin Button */}
          <Button
            onClick={handleSpin}
            disabled={isLoading || remainingSpins <= 0 || !address}
            size="lg"
            className="w-full h-16 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                {isEncrypting ? 'Encrypting...' : isWritePending ? 'Pending...' : isConfirming ? 'Confirming...' : 'Spinning...'}
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-6 w-6" />
                🎰 SPIN NOW
              </>
            )}
          </Button>

          {/* Status Alert */}
          {isLoading && (
            <Alert>
              <AlertDescription>
                {isEncrypting && 'Encrypting prize data with FHE...'}
                {isWritePending && 'Submitting transaction to blockchain...'}
                {isConfirming && 'Waiting for transaction confirmation...'}
                {isSpinning && 'Spin in progress...'}
              </AlertDescription>
            </Alert>
          )}

          {/* Transaction Hash */}
          {txHash && (
            <Alert>
              <AlertDescription>
                TX: {txHash.slice(0, 10)}...{txHash.slice(-10)}
              </AlertDescription>
            </Alert>
          )}

          {/* Latest Result */}
          {lastResult && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
              <h3 className="text-lg font-bold text-green-800 mb-2">🎉 Congratulations!</h3>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-3xl">{PRIZE_EMOJIS[lastResult.index]}</span>
                <div>
                  <div className="text-xl font-bold">{lastResult.prize.name}</div>
                  <div className="text-sm text-gray-600">
                    {lastResult.prize.value !== '0' ? `${lastResult.prize.value} Points` : 'Better luck next time!'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prize List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gift className="mr-2 h-5 w-5" />
            Available Prizes
          </CardTitle>
          <CardDescription>All possible prizes and their probabilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prizes.map((prize, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{PRIZE_EMOJIS[index]}</span>
                  <div className="flex-1">
                    <div className="font-bold">{prize.name}</div>
                    <div className="text-sm text-gray-600">
                      {prize.value !== '0' ? `${prize.value} Points` : 'Try again'}
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      {prize.probability}% chance
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Win History Section Inside Available Prizes */}
          {winHistory.length > 0 && (
            <div className="mt-6 pt-6 border-t-2 border-gray-200">
              <div className="flex items-center mb-4">
                <History className="mr-2 h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-bold">Your Recent Wins</h3>
              </div>
              <div className="space-y-3">
                {winHistory.map((win, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{PRIZE_EMOJIS[win.index]}</span>
                      <div>
                        <div className="font-bold">{win.prize.name}</div>
                        <div className="text-sm text-gray-600">
                          {win.prize.value !== '0' ? `${win.prize.value} Points` : 'Try again'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(win.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5" />
            How to Play
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• Each spin costs 0.01 ETH on Sepolia testnet</p>
          <p>• Results are secured using Fully Homomorphic Encryption (FHE)</p>
          <p>• Prizes are automatically distributed after each spin</p>
          <p>• Maximum 10 spins per day per address</p>
          <p>• All transactions are verified on-chain for transparency</p>
        </CardContent>
      </Card>

      {/* Success Modal */}
      {showSuccessModal && selectedPrize !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
            {/* Confetti/Celebration Emoji */}
            <div className="text-6xl mb-4 animate-bounce">
              🎉
            </div>

            {/* Success Title */}
            <h2 className="text-3xl font-bold text-green-600 mb-2">
              Congratulations!
            </h2>

            <p className="text-gray-600 mb-6">
              Transaction confirmed on Sepolia!
            </p>

            {/* Prize Display */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6 mb-6">
              <div className="text-5xl mb-3">
                {PRIZE_EMOJIS[selectedPrize]}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {prizes[selectedPrize].name}
              </h3>
              {prizes[selectedPrize].value !== '0' && (
                <p className="text-lg text-purple-600 font-semibold">
                  {prizes[selectedPrize].value} Points
                </p>
              )}
            </div>

            {/* Transaction Hash */}
            {txHash && (
              <div className="mb-6 text-sm">
                <p className="text-gray-500 mb-1">Transaction Hash:</p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline break-all"
                >
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </a>
              </div>
            )}

            {/* Close Button */}
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                setIsSpinning(false);
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Awesome! 🎊
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
