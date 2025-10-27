import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESSES, LUCKY_SPIN_CONFIG, PRIZE_INFO } from '@/config/contracts';
import SimpleFHELuckySpinABI from '@/contracts/SimpleFHELuckySpin.json';
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
    address: CONTRACT_ADDRESSES.SimpleFHELuckySpin,
    abi: SimpleFHELuckySpinABI.abi,
    functionName: 'getRemainingSpins',
    args: address ? [address] : undefined,
  });

  const { data: userSpinCount } = useReadContract({
    address: CONTRACT_ADDRESSES.SimpleFHELuckySpin,
    abi: SimpleFHELuckySpinABI.abi,
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
      const contractAddress = CONTRACT_ADDRESSES.SimpleFHELuckySpin;
      if (!contractAddress) {
        throw new Error('SimpleFHELuckySpin address not configured');
      }

      const provider = (window as any).ethereum;
      const encrypted = await encryptUint8(prizeIndex, contractAddress, address, provider);
      console.log('🔐 [Spin] Encrypted prize index');

      setIsEncrypting(false);

      // Submit to contract with proper gas limit
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.SimpleFHELuckySpin,
        abi: SimpleFHELuckySpinABI.abi,
        functionName: 'spin',
        args: [encrypted.handle, encrypted.proof],
        value: parseEther(LUCKY_SPIN_CONFIG.SPIN_COST),
        gas: BigInt(5000000), // Simplified contract needs less gas
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
