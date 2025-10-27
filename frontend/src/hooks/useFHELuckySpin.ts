import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACT_ADDRESSES, LUCKY_SPIN_CONFIG } from '@/config/contracts';
import FHELuckySpinV2ABI from '@/contracts/FHELuckySpinV2.json';
import { useState, useCallback, useEffect } from 'react';
import { encryptUint8, generateRandomUint8 } from '@/lib/fhe';

export interface SpinRecord {
  timestamp: bigint;
  prizeName: string;
  prizeValue: bigint;
  claimed: boolean;
}

export function useFHELuckySpin() {
  const { address } = useAccount();
  const [isEncrypting, setIsEncrypting] = useState(false);
  const { writeContractAsync, data: hash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Read functions with auto-refresh
  const { data: remainingSpins, refetch: refetchRemainingSpins } = useReadContract({
    address: CONTRACT_ADDRESSES.FHELuckySpinV2,
    abi: FHELuckySpinV2ABI.abi,
    functionName: 'getRemainingSpins',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 3000, // Auto-refresh every 3 seconds
    },
  });

  const { data: userPoints, refetch: refetchUserPoints } = useReadContract({
    address: CONTRACT_ADDRESSES.FHELuckySpinV2,
    abi: FHELuckySpinV2ABI.abi,
    functionName: 'getUserPoints',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 3000,
    },
  });

  const { data: userTotalEthWon, refetch: refetchUserEthWon } = useReadContract({
    address: CONTRACT_ADDRESSES.FHELuckySpinV2,
    abi: FHELuckySpinV2ABI.abi,
    functionName: 'getUserTotalEthWon',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 3000,
    },
  });

  const { data: userSpinCount, refetch: refetchSpinCount } = useReadContract({
    address: CONTRACT_ADDRESSES.FHELuckySpinV2,
    abi: FHELuckySpinV2ABI.abi,
    functionName: 'getUserSpinCount',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 3000,
    },
  });

  const { data: globalStats, refetch: refetchGlobalStats } = useReadContract({
    address: CONTRACT_ADDRESSES.FHELuckySpinV2,
    abi: FHELuckySpinV2ABI.abi,
    functionName: 'getGlobalStats',
    query: {
      refetchInterval: 3000,
    },
  });

  const { data: contractBalance, refetch: refetchContractBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.FHELuckySpinV2,
    abi: FHELuckySpinV2ABI.abi,
    functionName: 'getContractBalance',
    query: {
      refetchInterval: 3000,
    },
  });

  const { data: spinHistory, refetch: refetchSpinHistory } = useReadContract({
    address: CONTRACT_ADDRESSES.FHELuckySpinV2,
    abi: FHELuckySpinV2ABI.abi,
    functionName: 'getUserSpinHistory',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 3000,
    },
  });

  // Hook to get decryption status for a specific spin
  const useDecryptionStatus = (spinId: number) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.FHELuckySpinV2,
      abi: FHELuckySpinV2ABI.abi,
      functionName: 'getDecryptionStatus',
      args: address ? [address, BigInt(spinId)] : undefined,
      query: {
        enabled: !!address && spinId >= 0,
        refetchInterval: 3000,
      },
    });
  };

  // Write functions
  const spin = useCallback(async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsEncrypting(true);

      // Generate random number and encrypt it
      const randomValue = generateRandomUint8();
      const contractAddress = CONTRACT_ADDRESSES.FHELuckySpinV2;
      if (!contractAddress) {
        throw new Error('FHELuckySpinV2 address not configured');
      }

      // Get the wallet provider for FHE encryption
      const provider = (window as any).ethereum;
      const encrypted = await encryptUint8(randomValue, contractAddress, address, provider);

      setIsEncrypting(false);

      // Call spin function with encrypted random number
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.FHELuckySpinV2,
        abi: FHELuckySpinV2ABI.abi,
        functionName: 'spin',
        args: [encrypted.handle, encrypted.proof],
        value: parseEther(LUCKY_SPIN_CONFIG.SPIN_COST),
      });

      return txHash;
    } catch (error) {
      setIsEncrypting(false);
      throw error;
    }
  }, [address, writeContractAsync]);

  const requestDecryption = useCallback(async (spinId: number) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    return await writeContractAsync({
      address: CONTRACT_ADDRESSES.FHELuckySpinV2,
      abi: FHELuckySpinV2ABI.abi,
      functionName: 'requestSpinResultDecryption',
      args: [BigInt(spinId)],
    });
  }, [address, writeContractAsync]);

  const claimPrize = useCallback(async (spinId: number) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    return await writeContractAsync({
      address: CONTRACT_ADDRESSES.FHELuckySpinV2,
      abi: FHELuckySpinV2ABI.abi,
      functionName: 'claimPrize',
      args: [BigInt(spinId)],
    });
  }, [address, writeContractAsync]);

  const depositFunds = useCallback(async (amount: string) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    return await writeContractAsync({
      address: CONTRACT_ADDRESSES.FHELuckySpinV2,
      abi: FHELuckySpinV2ABI.abi,
      functionName: 'depositFunds',
      value: parseEther(amount),
    });
  }, [address, writeContractAsync]);

  // Refetch all data
  const refetchAll = useCallback(() => {
    refetchRemainingSpins();
    refetchUserPoints();
    refetchUserEthWon();
    refetchSpinCount();
    refetchGlobalStats();
    refetchContractBalance();
    refetchSpinHistory();
  }, [
    refetchRemainingSpins,
    refetchUserPoints,
    refetchUserEthWon,
    refetchSpinCount,
    refetchGlobalStats,
    refetchContractBalance,
    refetchSpinHistory,
  ]);

  // Auto-refetch when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      setTimeout(() => {
        refetchAll();
      }, 1000);
    }
  }, [isConfirmed, refetchAll]);

  return {
    // User data
    remainingSpins: remainingSpins ? Number(remainingSpins) : 0,
    userPoints: userPoints ? Number(userPoints) : 0,
    userTotalEthWon: userTotalEthWon ? formatEther(userTotalEthWon as bigint) : '0',
    userSpinCount: userSpinCount ? Number(userSpinCount) : 0,

    // Global stats
    globalStats: globalStats ? {
      totalPointsDistributed: Number((globalStats as any[])[0]),
      totalEthDistributed: formatEther((globalStats as any[])[1] as bigint),
      contractBalance: formatEther((globalStats as any[])[2] as bigint),
      spinCost: formatEther((globalStats as any[])[3] as bigint),
    } : null,

    contractBalance: contractBalance ? formatEther(contractBalance as bigint) : '0',

    // Spin history
    spinHistory: spinHistory ? {
      timestamps: (spinHistory as any[])[0] as bigint[],
      prizeNames: (spinHistory as any[])[1] as string[],
      prizeValues: (spinHistory as any[])[2] as bigint[],
      claimed: (spinHistory as any[])[3] as boolean[],
    } : null,

    // Write functions
    spin,
    requestDecryption,
    claimPrize,
    depositFunds,
    
    // Read functions
    useDecryptionStatus,

    // Loading states
    isEncrypting,
    isWritePending,
    isConfirming,
    isConfirmed,
    txHash: hash,

    // Refetch function
    refetchAll,
  };
}
