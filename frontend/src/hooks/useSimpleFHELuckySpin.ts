import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useState, useCallback, useEffect } from 'react';
import { encryptUint8, generateRandomUint8 } from '@/lib/fhe';

// Contract address with FHE encryption support
const SIMPLE_CONTRACT_ADDRESS = '0xAAf9C80eb68Fb36764092675412772d20d729A76' as `0x${string}`;

// Simplified ABI (only essential methods)
  const SIMPLE_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "encryptedPrizeIndex",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "proof",
        "type": "bytes"
      }
    ],
    "name": "spin",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "spinId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "decryptedPrizeIndex",
        "type": "uint8"
      }
    ],
    "name": "claimPrize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "prizeId",
        "type": "uint256"
      }
    ],
    "name": "getPrize",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "probability",
            "type": "uint8"
          },
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          }
        ],
        "internalType": "struct SimpleFHELuckySpin.Prize",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPrizeCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getRemainingSpins",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserSpinCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export interface Prize {
  name: string;
  value: bigint;
  probability: number;
  active: boolean;
}

export interface SpinRecord {
  user: string;
  timestamp: bigint;
  claimed: boolean;
  prizeName: string;
  prizeValue: bigint;
}

export function useSimpleFHELuckySpin() {
  const { address } = useAccount();
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<number | null>(null);
  const { writeContractAsync, data: hash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Read prize information
  const { data: prizeCount } = useReadContract({
    address: SIMPLE_CONTRACT_ADDRESS,
    abi: SIMPLE_ABI,
    functionName: 'getPrizeCount',
  });

  // Read user information
  const { data: remainingSpins, refetch: refetchRemainingSpins } = useReadContract({
    address: SIMPLE_CONTRACT_ADDRESS,
    abi: SIMPLE_ABI,
    functionName: 'getRemainingSpins',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 3000,
    },
  });

  const { data: userSpinCount, refetch: refetchUserSpinCount } = useReadContract({
    address: SIMPLE_CONTRACT_ADDRESS,
    abi: SIMPLE_ABI,
    functionName: 'getUserSpinCount',
    args: address ? [address] : undefined,
    query: {
      refetchInterval: 3000,
    },
  });

  const { data: contractBalance, refetch: refetchContractBalance } = useReadContract({
    address: SIMPLE_CONTRACT_ADDRESS,
    abi: SIMPLE_ABI,
    functionName: 'getContractBalance',
    query: {
      refetchInterval: 3000,
    },
  });

  // Get prize information
  const getPrize = useCallback(async (prizeId: number): Promise<Prize> => {
    const result = await fetch(`/api/getPrize?prizeId=${prizeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractAddress: SIMPLE_CONTRACT_ADDRESS,
        prizeId,
      }),
    });
    
    if (!result.ok) {
      throw new Error('Failed to get prize');
    }
    
    const data = await result.json();
    return {
      name: data.name,
      value: BigInt(data.value),
      probability: data.probability,
      active: data.active,
    };
  }, []);

  // Get all prizes
  const getAllPrizes = useCallback(async (): Promise<Prize[]> => {
    if (!prizeCount) return [];
    
    const prizes: Prize[] = [];
    for (let i = 0; i < Number(prizeCount); i++) {
      try {
        const prize = await getPrize(i);
        prizes.push(prize);
      } catch (error) {
        console.error(`Failed to get prize ${i}:`, error);
      }
    }
    return prizes;
  }, [prizeCount, getPrize]);

  // Spin functionality with FHE encryption
  const spin = useCallback(async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsEncrypting(true);

      // 1. Select prize index (0-4)
      const randomPrizeIndex = Math.floor(Math.random() * 5);
      setSelectedPrize(randomPrizeIndex);

      console.log('🎰 Selected prize index:', randomPrizeIndex);

      // 2. Encrypt prize index with FHE
      const provider = (window as any).ethereum;
      const encrypted = await encryptUint8(randomPrizeIndex, SIMPLE_CONTRACT_ADDRESS, address, provider);

      console.log('🔒 Encrypted prize index:', { 
        handle: encrypted.handle, 
        proofLength: encrypted.proof.length 
      });

      setIsEncrypting(false);

      // 3. Call contract spin function with encrypted handle and proof
      const txHash = await writeContractAsync({
        address: SIMPLE_CONTRACT_ADDRESS,
        abi: SIMPLE_ABI,
        functionName: 'spin',
        args: [encrypted.handle, encrypted.proof],
        value: parseEther('0.01'),
      });

      return { txHash, selectedPrize: randomPrizeIndex };
    } catch (error) {
      setIsEncrypting(false);
      throw error;
    }
  }, [address, writeContractAsync]);

  // Claim prize
  const claimPrize = useCallback(async (spinId: number, decryptedPrizeIndex: number) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    return await writeContractAsync({
      address: SIMPLE_CONTRACT_ADDRESS,
      abi: SIMPLE_ABI,
      functionName: 'claimPrize',
      args: [BigInt(spinId), decryptedPrizeIndex],
    });
  }, [address, writeContractAsync]);

  // Auto claim prize after successful spin
  const autoClaimPrize = useCallback(async () => {
    if (selectedPrize === null || !userSpinCount) return;

    try {
      const spinId = Number(userSpinCount) - 1; // Latest spin record
      await claimPrize(spinId, selectedPrize);
      console.log('🎁 Prize claimed automatically');
    } catch (error) {
      console.error('Failed to claim prize:', error);
    }
  }, [selectedPrize, userSpinCount, claimPrize]);

  // Auto claim prize after confirmation
  useEffect(() => {
    if (isConfirmed && selectedPrize !== null) {
      setTimeout(() => {
        autoClaimPrize();
      }, 2000); // Wait 2 seconds before auto-claiming
    }
  }, [isConfirmed, selectedPrize, autoClaimPrize]);

  // Refetch all data
  const refetchAll = useCallback(() => {
    refetchRemainingSpins();
    refetchUserSpinCount();
    refetchContractBalance();
  }, [refetchRemainingSpins, refetchUserSpinCount, refetchContractBalance]);

  // Auto refresh after confirmation
  useEffect(() => {
    if (isConfirmed) {
      setTimeout(() => {
        refetchAll();
      }, 1000);
    }
  }, [isConfirmed, refetchAll]);

  return {
    // Contract address
    contractAddress: SIMPLE_CONTRACT_ADDRESS,

    // User data
    remainingSpins: remainingSpins ? Number(remainingSpins) : 0,
    userSpinCount: userSpinCount ? Number(userSpinCount) : 0,
    contractBalance: contractBalance ? formatEther(contractBalance as bigint) : '0',

    // Prize data
    prizeCount: prizeCount ? Number(prizeCount) : 0,
    getAllPrizes,
    getPrize,

    // Spin functionality
    spin,
    claimPrize,
    selectedPrize,

    // Status
    isEncrypting,
    isWritePending,
    isConfirming,
    isConfirmed,
    txHash: hash,

    // Utility functions
    refetchAll,
  };
}
