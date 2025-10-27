/**
 * Contract addresses and configuration
 */

export const CONTRACT_ADDRESSES = {
  FHELuckySpinV2: (import.meta.env.VITE_FHE_LUCKY_SPIN_V2_ADDRESS || '0x7fe8D79646dF497D82B6703e6CF6Dac9183794e0') as `0x${string}`,
  PrizeManager: (import.meta.env.VITE_PRIZE_MANAGER_ADDRESS || '0xDaE0bC40899B0b9ddf09f80aCe5B1e6cc7856627') as `0x${string}`,
  SpinManager: (import.meta.env.VITE_SPIN_MANAGER_ADDRESS || '0xA3FbB1676e824c594d9aD313EED7C110AfE87517') as `0x${string}`,
  UserRecords: (import.meta.env.VITE_USER_RECORDS_ADDRESS || '0x763c4feF42D9B469D394772e0DbD3C40337dd07F') as `0x${string}`,
  RewardDistributor: (import.meta.env.VITE_REWARD_DISTRIBUTOR_ADDRESS || '0x95BdAddCF78e54B2D5d49a1d53c8749087916414') as `0x${string}`,
} as const;

export const LUCKY_SPIN_CONFIG = {
  SPIN_COST: '0.01', // ETH
  MAX_DAILY_SPINS: 10,
  SEPOLIA_CHAIN_ID: Number(import.meta.env.VITE_SEPOLIA_CHAIN_ID) || 11155111,
} as const;

export const PRIZE_INFO = [
  { name: 'Thank You', emoji: '🙏', value: '0', type: 'POINTS', probability: 40 },
  { name: '100 Points', emoji: '💎', value: '100', type: 'POINTS', probability: 30 },
  { name: '500 Points', emoji: '⭐', value: '500', type: 'POINTS', probability: 20 },
  { name: '1000 Points', emoji: '💰', value: '1000', type: 'POINTS', probability: 8 },
  { name: '5000 Points', emoji: '🎁', value: '5000', type: 'POINTS', probability: 2 },
] as const;
