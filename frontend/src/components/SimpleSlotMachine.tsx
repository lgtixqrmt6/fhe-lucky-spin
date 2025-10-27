import React, { useState, useEffect } from 'react';
import { useSimpleFHELuckySpin, Prize } from '@/hooks/useSimpleFHELuckySpin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Gift, Trophy, RotateCcw, History } from 'lucide-react';
import { useAccount } from 'wagmi';

const PRIZE_EMOJIS = ['🙏', '💎', '⭐', '💰', '🎁'];

export function SimpleSlotMachine() {
  const { address } = useAccount();
  const {
    contractAddress,
    remainingSpins,
    userSpinCount,
    contractBalance,
    prizeCount,
    getAllPrizes,
    spin,
    selectedPrize,
    isEncrypting,
    isWritePending,
    isConfirming,
    isConfirmed,
    txHash,
    refetchAll,
  } = useSimpleFHELuckySpin();

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<{ prize: Prize; index: number } | null>(null);
  const [reels, setReels] = useState<number[]>([0, 0, 0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [winHistory, setWinHistory] = useState<Array<{ prize: Prize; index: number; timestamp: number }>>([]);

  // Load prizes
  useEffect(() => {
    const loadPrizes = async () => {
      try {
        const allPrizes = await getAllPrizes();
        setPrizes(allPrizes);
      } catch (error) {
        console.error('Failed to load prizes:', error);
      }
    };

    if (prizeCount > 0) {
      loadPrizes();
    }
  }, [prizeCount, getAllPrizes]);

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

      const result = await spin();

      if (result.selectedPrize !== null && prizes[result.selectedPrize]) {
        // Set final result
        setTimeout(() => {
          setReels([result.selectedPrize, result.selectedPrize, result.selectedPrize]);
          const resultData = {
            prize: prizes[result.selectedPrize],
            index: result.selectedPrize,
            timestamp: Date.now(),
          };
          setLastResult(resultData);

          // Add to history
          setWinHistory(prev => [resultData, ...prev].slice(0, 10)); // Keep last 10
        }, 2000);
      }
    } catch (error) {
      console.error('Spin failed:', error);
      alert('Spin failed, please try again');
    } finally {
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
          Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contract Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{contractBalance} ETH</div>
            <p className="text-xs text-gray-500">Prize pool balance</p>
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
                    Value: {lastResult.prize.value > 0 ? `${Number(lastResult.prize.value) / 1e18} ETH` : 'Points Reward'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Win History */}
      {winHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="mr-2 h-5 w-5" />
              Your Recent Wins
            </CardTitle>
            <CardDescription>Last {winHistory.length} prizes you won</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {winHistory.map((win, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{PRIZE_EMOJIS[win.index]}</span>
                    <div>
                      <div className="font-bold">{win.prize.name}</div>
                      <div className="text-sm text-gray-600">
                        {win.prize.value > 0 ? `${Number(win.prize.value) / 1e18} ETH` : 'Points Reward'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(win.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                      {prize.value > 0 ? `${Number(prize.value) / 1e18} ETH` : 'Points Reward'}
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      {prize.probability}% chance
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
    </div>
  );
}
