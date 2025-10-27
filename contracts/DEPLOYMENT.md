# FHE Lucky Spin V2 - Deployment Guide

Complete guide for deploying the FHE Lucky Spin smart contracts to Sepolia testnet.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [Deployment](#deployment)
4. [Post-Deployment](#post-deployment)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- Node.js v18 or higher
- npm or yarn
- MetaMask or another Web3 wallet
- Sepolia testnet ETH

### Get Testnet ETH

You'll need approximately **0.3 ETH** on Sepolia testnet for deployment. Get testnet ETH from these faucets:

- [Sepolia Faucet](https://sepoliafaucet.com)
- [Infura Faucet](https://www.infura.io/faucet/sepolia)
- [QuickNode Faucet](https://faucet.quicknode.com/ethereum/sepolia)
- [Alchemy Faucet](https://sepoliafaucet.com)

## Setup

### 1. Install Dependencies

```bash
cd contracts
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `contracts` directory:

```bash
cp .env.example .env
```

Edit the `.env` file and add your configuration:

```env
# Your deployer private key (NEVER commit this!)
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Sepolia RPC URL (choose one or use your own)
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Etherscan API key (optional, for verification)
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# Initial prize pool funding (optional, in ETH)
INITIAL_PRIZE_POOL=1.0
```

**⚠️ IMPORTANT SECURITY NOTES:**

- **NEVER** commit your `.env` file to version control
- **NEVER** share your private key with anyone
- Make sure `.env` is listed in `.gitignore`
- Consider using a dedicated deployment wallet for security

### 3. Verify Hardhat Configuration

The `hardhat.config.js` is already configured for Sepolia. Verify it looks correct:

```javascript
networks: {
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    chainId: 11155111,
    gasPrice: "auto"
  }
}
```

## Deployment

### 1. Compile Contracts

```bash
npm run compile
```

Expected output:
```
Compiled 18 Solidity files successfully
```

### 2. Run Deployment Script

```bash
npm run deploy:sepolia
```

Or manually:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 3. Deployment Process

The script will:

1. **Deploy PrizeManager** - Manages prize configuration (5 prize tiers)
2. **Deploy SpinManager** - Handles FHE-encrypted spin logic
3. **Deploy UserRecords** - Tracks user spin history and daily limits
4. **Deploy RewardDistributor** - Manages prize distribution (points & ETH)
5. **Deploy FHELuckySpinV2** - Main orchestration contract
6. **Set up authorizations** - Configure contract-to-contract permissions (7 transactions)
7. **Fund RewardDistributor** (optional) - Add initial prize pool
8. **Verify deployment** - Check contract state
9. **Save deployment info** - Create `deployments/sepolia.json`
10. **Update frontend .env** - Auto-populate contract addresses

### 4. Expected Gas Costs

| Contract | Estimated Gas Cost |
|----------|-------------------|
| PrizeManager | ~0.02 ETH |
| SpinManager | ~0.03 ETH |
| UserRecords | ~0.04 ETH |
| RewardDistributor | ~0.02 ETH |
| FHELuckySpinV2 | ~0.03 ETH |
| Authorizations (7 txs) | ~0.007 ETH |
| **Total** | **~0.15 ETH** |

**Recommendation:** Have at least 0.3 ETH for safety and prize funding.

### 5. Deployment Output

Upon successful deployment, you'll see:

```
========================================
✅ DEPLOYMENT COMPLETED SUCCESSFULLY!
========================================

Contract Addresses:
  PrizeManager:        0x...
  SpinManager:         0x...
  UserRecords:         0x...
  RewardDistributor:   0x...
  FHELuckySpinV2:      0x...

📋 Next Steps:
  1. Verify contracts on Etherscan (optional)
  2. Fund the RewardDistributor with ETH for prizes
  3. Deploy frontend with updated contract addresses
  4. Test the application on Sepolia testnet
========================================
```

## Post-Deployment

### 1. Fund RewardDistributor

If you didn't set `INITIAL_PRIZE_POOL` in `.env`, fund the contract manually:

```bash
# Using Hardhat console
npx hardhat console --network sepolia

> const [signer] = await ethers.getSigners();
> await signer.sendTransaction({
    to: "REWARD_DISTRIBUTOR_ADDRESS",
    value: ethers.parseEther("1.0")
  });
```

Or use MetaMask to send ETH directly to the RewardDistributor address.

### 2. Verify Contracts on Etherscan

Verify each contract for transparency:

```bash
# PrizeManager
npx hardhat verify --network sepolia PRIZE_MANAGER_ADDRESS

# SpinManager
npx hardhat verify --network sepolia SPIN_MANAGER_ADDRESS

# UserRecords
npx hardhat verify --network sepolia USER_RECORDS_ADDRESS

# RewardDistributor
npx hardhat verify --network sepolia REWARD_DISTRIBUTOR_ADDRESS

# FHELuckySpinV2
npx hardhat verify --network sepolia FHE_LUCKY_SPIN_V2_ADDRESS \
  PRIZE_MANAGER_ADDRESS \
  SPIN_MANAGER_ADDRESS \
  USER_RECORDS_ADDRESS \
  REWARD_DISTRIBUTOR_ADDRESS
```

### 3. Check Frontend .env

The deployment script automatically updates `frontend/.env`:

```bash
cat ../frontend/.env
```

Should contain:

```env
VITE_FHE_LUCKY_SPIN_V2_ADDRESS=0x...
VITE_PRIZE_MANAGER_ADDRESS=0x...
VITE_SPIN_MANAGER_ADDRESS=0x...
VITE_USER_RECORDS_ADDRESS=0x...
VITE_REWARD_DISTRIBUTOR_ADDRESS=0x...
VITE_SEPOLIA_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

## Verification

### 1. Check Contract State

```bash
npx hardhat console --network sepolia
```

```javascript
const FHELuckySpinV2 = await ethers.getContractFactory("FHELuckySpinV2");
const contract = FHELuckySpinV2.attach("FHE_LUCKY_SPIN_V2_ADDRESS");

// Check prize count
await contract.getPrizeCount(); // Should return 5

// Check global stats
const stats = await contract.getGlobalStats();
console.log("Total Points Distributed:", stats[0].toString());
console.log("Total ETH Distributed:", ethers.formatEther(stats[1]));
console.log("Contract Balance:", ethers.formatEther(stats[2]));
console.log("Spin Cost:", ethers.formatEther(stats[3])); // Should be 0.05 ETH
```

### 2. Test Spin Function

```javascript
// Get remaining spins (should be 10 for new user)
await contract.getRemainingSpins(YOUR_ADDRESS);

// Check user points
await contract.getUserPoints(YOUR_ADDRESS);
```

## Troubleshooting

### Issue: "Insufficient funds for gas"

**Solution:** Get more testnet ETH from faucets listed above.

### Issue: "Transaction failed"

**Possible causes:**
- Gas price too low (increase in `hardhat.config.js`)
- Network congestion (wait and retry)
- Incorrect RPC URL (check `.env`)

### Issue: "Contract not found"

**Solution:** Make sure contracts are compiled:
```bash
npx hardhat clean
npx hardhat compile
```

### Issue: "Authorization failed"

**Solution:** The deployment script sets up all authorizations automatically. If manual setup is needed:

```javascript
// Example: Authorize FHELuckySpinV2 in PrizeManager
const prizeManager = PrizeManager.attach("PRIZE_MANAGER_ADDRESS");
await prizeManager.setAuthorization("FHE_LUCKY_SPIN_V2_ADDRESS", true);
```

### Issue: "Frontend can't connect to contracts"

**Solutions:**
1. Check that `frontend/.env` has correct addresses
2. Verify RPC URL is working
3. Check that wallet is connected to Sepolia network
4. Ensure you have Sepolia ETH for gas

## Contract Architecture

```
FHELuckySpinV2 (Main Orchestrator)
├── PrizeManager (Prize configuration)
├── SpinManager (FHE spin logic)
├── UserRecords (History & limits)
└── RewardDistributor (Prize distribution)
```

### Authorization Flow

```
FHELuckySpinV2 → PrizeManager ✓
FHELuckySpinV2 → SpinManager ✓
FHELuckySpinV2 → UserRecords ✓
FHELuckySpinV2 → RewardDistributor ✓
SpinManager → PrizeManager ✓
```

## Game Parameters

- **Spin Cost:** 0.05 ETH
- **Daily Limit:** 10 spins per user
- **Prize Tiers:** 5 (Thank You, 100pts, 500pts, 0.1 ETH, 0.5 ETH)
- **Probabilities:** 40%, 30%, 20%, 8%, 2%

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/getting-started/)
- [Zama fhEVM Documentation](https://docs.zama.ai/fhevm)
- [Sepolia Testnet Explorer](https://sepolia.etherscan.io/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review deployment logs in `deployments/sepolia.json`
3. Verify all environment variables are set correctly
4. Ensure you have sufficient testnet ETH

---

**Last Updated:** 2025-10-25
