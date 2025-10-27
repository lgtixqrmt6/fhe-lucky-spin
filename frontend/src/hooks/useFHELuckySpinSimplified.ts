import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, LUCKY_SPIN_CONFIG, PRIZE_INFO } from '@/config/contracts';
import FHELuckySpinV2ABI from '@/contracts/FHELuckySpinV2.json';
import { useState, useCallback } from 'react';
import { encryptUint8 } from '@/lib/fhe';

export function useFHELuckySpinSimplified() {
  const { address } = useAccount();
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<number | null>(null);

  const { writeContractAsync, data: hash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Read user data
  const { data: remainingSpins } = useReadContract({
    address: CONTRACT_ADDRESSES.FHELuckySpinV2,
    abi: FHELuckySpinV2ABI.abi,
    functionName: 'getRemainingSpins',
    args: address ? [address] : undefined,
  });

  const { data: userPoints } = useReadContract({
    address: CONTRACT_ADDRESSES.FHELuckySpinV2,
    abi: FHELuckySpinV2ABI.abi,
    functionName: 'getUserPoints',
    args: address ? [address] : undefined,
  });

  const { data: userSpinCount } = useReadContract({
    address: CONTRACT_ADDRESSES.FHELuckySpinV2,
    abi: FHELuckySpinV2ABI.abi,
    functionName: 'getUserSpinCount',
    args: address ? [address] : undefined,
  });

  /**
   * Select prize based on probability distribution
   */
  const selectPrize = (): number => {
    const random = Math.random() * 100;
    let cumulativeProbability = 0;

    for (let i = 0; i < PRIZE_INFO.length; i++) {
      cumulativeProbability += PRIZE_INFO[i].probability;
      if (random < cumulativeProbability) {
        return i;
      }
    }

    return 0; // Fallback to first prize
  };

  /**
   * Execute spin - frontend chooses prize, encrypt and send to contract
   */
  const spin = useCallback(async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsEncrypting(true);

      // Frontend selects prize
      const prizeIndex = selectPrize();
      setSelectedPrize(prizeIndex);
      console.log('🎰 [Spin] Selected prize:', PRIZE_INFO[prizeIndex].name, 'Index:', prizeIndex);

      // Encrypt prize index
      const contractAddress = CONTRACT_ADDRESSES.FHELuckySpinV2;
      if (!contractAddress) {
        throw new Error('FHELuckySpinV2 address not configured');
      }

      const provider = (window as any).ethereum;
      const encrypted = await encryptUint8(prizeIndex, contractAddress, address, provider);
      console.log('🔐 [Spin] Encrypted prize index');

      setIsEncrypting(false);

      // Submit to contract
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.FHELuckySpinV2,
        abi: FHELuckySpinV2ABI.abi,
        functionName: 'spin',
        args: [encrypted.handle, encrypted.proof],
        value: parseEther(LUCKY_SPIN_CONFIG.SPIN_COST),
      });

      console.log('✅ [Spin] Transaction submitted:', txHash);
      return txHash;
    } catch (error) {
      setIsEncrypting(false);
      setSelectedPrize(null);
      throw error;
    }
  }, [address, writeContractAsync]);

  return {
    // User data
    remainingSpins: remainingSpins ? Number(remainingSpins) : 0,
    userPoints: userPoints ? Number(userPoints) : 0,
    userSpinCount: userSpinCount ? Number(userSpinCount) : 0,

    // Selected prize
    selectedPrize,
    selectedPrizeName: selectedPrize !== null ? PRIZE_INFO[selectedPrize].name : null,

    // Write functions
    spin,

    // Loading states
    isEncrypting,
    isWritePending,
    isConfirming,
    isConfirmed,

    // Transaction hash
    hash,
  };
}
