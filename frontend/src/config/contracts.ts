/**
 * Contract addresses and configuration
 */

export const CONTRACT_ADDRESSES = {
  SimpleFHELuckySpin: (import.meta.env.VITE_SIMPLE_FHE_LUCKY_SPIN_ADDRESS || '0x064bc936B520902F1dbc7E9E9eA636aCF1B82128') as `0x${string}`,
} as const;

// Game configuration
export const LUCKY_SPIN_CONFIG = {
  SPIN_COST: '0.01', // ETH per spin
  MAX_DAILY_SPINS: 10, // Maximum spins per day per address
  SEPOLIA_CHAIN_ID: Number(import.meta.env.VITE_SEPOLIA_CHAIN_ID) || 11155111,
} as const;

export const PRIZE_INFO = [
  { name: 'Thank You', emoji: '🙏', value: '0', type: 'POINTS', probability: 40 },
  { name: '100 Points', emoji: '💎', value: '100', type: 'POINTS', probability: 30 },
  { name: '500 Points', emoji: '⭐', value: '500', type: 'POINTS', probability: 20 },
  { name: '1000 Points', emoji: '💰', value: '1000', type: 'POINTS', probability: 8 },
  { name: '5000 Points', emoji: '🎁', value: '5000', type: 'POINTS', probability: 2 },
] as const;
