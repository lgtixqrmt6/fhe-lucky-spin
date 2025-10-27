import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useFHELuckySpin } from "@/hooks/useFHELuckySpin";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { PRIZE_INFO, LUCKY_SPIN_CONFIG } from "@/config/contracts";

export const SlotMachine = () => {
  const { address } = useAccount();
  const [isSpinning, setIsSpinning] = useState(false);
  const [reels, setReels] = useState([0, 0, 0, 0, 0]);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const {
    remainingSpins,
    userPoints,
    userTotalEthWon,
    userSpinCount,
    spin,
    isEncrypting,
    isWritePending,
    isConfirming,
    isConfirmed,
    refetchAll,
  } = useFHELuckySpin();

  // Refetch data when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      setTimeout(() => {
        refetchAll();
        toast.success("Spin completed! Check your history to claim prizes.");
      }, 2000);
    }
  }, [isConfirmed, refetchAll]);

  const handleSpin = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (remainingSpins <= 0) {
      toast.error(`Daily limit reached! You can spin ${LUCKY_SPIN_CONFIG.MAX_DAILY_SPINS} times per day.`);
      return;
    }

    try {
      setIsSpinning(true);
      setLastResult(null);

      // Show signing prompt
      toast.info("Please sign in your wallet to generate encryption keys", {
        duration: 5000,
      });

      // Animate reels spinning
      const spinDuration = 2500;
      const spinInterval = 100;
      let elapsed = 0;

      const interval = setInterval(() => {
        setReels(PRIZE_INFO.map(() => Math.floor(Math.random() * PRIZE_INFO.length)));

        elapsed += spinInterval;

        if (elapsed >= spinDuration) {
          clearInterval(interval);
        }
      }, spinInterval);

      // Execute blockchain spin
      await spin();

      // Final animation
      setTimeout(() => {
        setReels([0, 1, 2, 3, 4]);
        setLastResult("Spin submitted! Waiting for blockchain confirmation...");
        setIsSpinning(false);
      }, spinDuration);

    } catch (error: any) {
      setIsSpinning(false);
      console.error("Spin error:", error);
      toast.error(error?.message || "Failed to spin. Please try again.");
    }
  };

  const isLoading = isEncrypting || isWritePending || isConfirming || isSpinning;
  const buttonText = isEncrypting
    ? "Encrypting..."
    : isWritePending
    ? "Confirm in Wallet..."
    : isConfirming
    ? "Confirming..."
    : isSpinning
    ? "Spinning..."
    : "SPIN NOW";

  return (
    <div className="flex flex-col items-center gap-8">
      {/* User Stats */}
      {address && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-4xl mb-4">
          <Card className="p-4 bg-card/50 backdrop-blur border-2 border-primary/20">
            <div className="text-sm text-muted-foreground mb-1">Spins Left Today</div>
            <div className="text-2xl font-bold text-primary">{remainingSpins}/{LUCKY_SPIN_CONFIG.MAX_DAILY_SPINS}</div>
          </Card>

          <Card className="p-4 bg-card/50 backdrop-blur border-2 border-secondary/20">
            <div className="text-sm text-muted-foreground mb-1">Total Spins</div>
            <div className="text-2xl font-bold text-secondary">{userSpinCount}</div>
          </Card>

          <Card className="p-4 bg-card/50 backdrop-blur border-2 border-accent/20">
            <div className="text-sm text-muted-foreground mb-1">Points</div>
            <div className="text-2xl font-bold text-accent">{userPoints.toLocaleString()}</div>
          </Card>

          <Card className="p-4 bg-card/50 backdrop-blur border-2 border-primary/20">
            <div className="text-sm text-muted-foreground mb-1">ETH Won</div>
            <div className="text-2xl font-bold text-primary">{parseFloat(userTotalEthWon).toFixed(4)}</div>
          </Card>
        </div>
      )}

      {/* Slot Machine Container */}
      <div className="relative">
        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-gold opacity-30 blur-3xl animate-pulse-glow" />

        {/* Machine Body */}
        <div className="relative bg-gradient-to-b from-amber-600 to-amber-800 rounded-3xl p-8 shadow-2xl border-8 border-primary">
          {/* Top Decoration */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-48 h-12 bg-gradient-gold rounded-t-3xl border-4 border-primary flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">FHE LUCKY SPIN</span>
          </div>

          {/* Reels Display */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl p-6 mb-6 border-4 border-primary/50 shadow-inner">
            <div className="flex gap-3 justify-center items-center">
              {reels.map((reelIndex, index) => {
                const prize = PRIZE_INFO[reelIndex] || PRIZE_INFO[0];
                return (
                  <div
                    key={index}
                    className={cn(
                      "w-24 h-28 bg-gradient-to-b from-white to-gray-100 rounded-xl flex flex-col items-center justify-center",
                      "border-4 border-primary shadow-lg",
                      isSpinning && "animate-bounce-subtle"
                    )}
                  >
                    <span className="text-5xl mb-1">{prize.emoji}</span>
                    <span className="text-xs font-bold text-muted-foreground">{prize.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cost & Result Display */}
          <div className="min-h-[80px] flex flex-col items-center justify-center mb-4 gap-2">
            <div className="text-lg font-semibold text-primary-foreground">
              Cost: {LUCKY_SPIN_CONFIG.SPIN_COST} ETH per spin
            </div>
            {lastResult && (
              <div className="text-md font-medium text-center px-6 py-2 rounded-xl bg-secondary/80 text-secondary-foreground animate-pulse">
                {lastResult}
              </div>
            )}
          </div>

          {/* Spin Button */}
          <Button
            onClick={handleSpin}
            disabled={isLoading || !address || remainingSpins <= 0}
            className="w-full h-16 text-2xl font-bold bg-gradient-gold hover:opacity-90 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            {buttonText}
          </Button>

          {/* Connect Wallet Hint */}
          {!address && (
            <p className="text-center text-sm text-primary-foreground/70 mt-3">
              Connect your wallet to start spinning
            </p>
          )}
        </div>
      </div>

      {/* Prize Information */}
      <Card className="max-w-4xl w-full p-6 bg-card/50 backdrop-blur border-2 border-primary/30">
        <h3 className="text-xl font-bold mb-4 text-center bg-gradient-gold bg-clip-text text-transparent">
          Prize Tiers (Privacy-Protected with FHE)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {PRIZE_INFO.map((prize, index) => (
            <div
              key={index}
              className="flex flex-col items-center p-3 rounded-lg bg-gradient-to-b from-amber-100/10 to-amber-200/10 border border-primary/20"
            >
              <span className="text-4xl mb-2">{prize.emoji}</span>
              <span className="font-bold text-sm mb-1">{prize.name}</span>
              {prize.value !== '0' && (
                <span className="text-xs text-muted-foreground">
                  {prize.type === 'POINTS' ? `${prize.value} pts` : `${prize.value} ETH`}
                </span>
              )}
              <span className="text-xs text-primary mt-1">{prize.probability}%</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center mt-4">
          🔐 All spin results are encrypted using Fully Homomorphic Encryption for complete privacy
        </p>
      </Card>
    </div>
  );
};
