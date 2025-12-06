# Lucky Spin

A privacy-preserving lucky spin game built with **Fully Homomorphic Encryption (FHE)** technology, powered by Zama's fhEVM protocol. This decentralized application ensures complete fairness and privacy for all players while maintaining full transparency on the blockchain.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-blue)](https://docs.soliditylang.org)
[![fhEVM](https://img.shields.io/badge/fhEVM-0.9.1-purple)](https://docs.zama.ai/fhevm)

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Contract Functions](#contract-functions)
- [Development](#development)
- [License](#license)

## Overview

**Lucky Spin** is a next-generation decentralized spin wheel game that leverages Fully Homomorphic Encryption to provide unprecedented privacy guarantees. Unlike traditional blockchain games where results are predictable or visible, our system ensures:

- **Privacy-preserving gameplay** with FHE encryption
- **Verifiable fairness** through on-chain random number generation
- **Zero-knowledge privacy** - only you can see your encrypted results
- **Points-based rewards** with multiple prize tiers
- **Daily limits** to ensure fair play

### Key Innovation: FHE-Powered Privacy

Traditional blockchain games expose all results publicly. Lucky Spin uses Zama's fhEVM to perform computations on encrypted data, ensuring:

1. **Spin Privacy**: Your spin result is encrypted on-chain
2. **Encrypted Computation**: Prize selection happens on encrypted values
3. **Only Final Result Revealed**: Only your prize is revealed after spinning

## How It Works

### The Complete Spin Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SPIN LIFECYCLE                            │
└─────────────────────────────────────────────────────────────┘

1. USER INITIATES SPIN
   │
   ├─► User pays spin fee
   │   ├─ FHE SDK generates encrypted random value
   │   ├─ Encrypted value + proof sent to contract
   │   └─ Contract processes encrypted spin
   │
2. ON-CHAIN PROCESSING
   │
   ├─► Contract generates encrypted result
   │   ├─ FHE operations on encrypted values
   │   └─ Prize tier determined via encrypted comparison
   │
3. RESULT REVELATION
   │
   ├─► User requests decryption
   │   ├─ Zama Gateway handles decryption
   │   └─ Prize points revealed to user
   │
4. REWARD DISTRIBUTION
   │
   └─► Points credited to user
       ├─ User history updated
       └─ Leaderboard updated
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SMART CONTRACTS                           │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐     │
│  │   Spin      │  │    Prize     │  │      User       │     │
│  │  Manager    │  │   Manager    │  │    Records      │     │
│  └──────┬──────┘  └──────┬───────┘  └────────┬────────┘     │
│         │                │                    │              │
│         └────────────────┼────────────────────┘              │
│                          │                                   │
│              ┌───────────┴───────────┐                       │
│              │   FHELuckySpinV2      │                       │
│              │   (Main Contract)     │                       │
│              └───────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐     │
│  │   Wagmi     │  │   FHE SDK    │  │    RainbowKit   │     │
│  │  + Viem     │  │  (Relayer)   │  │    (Wallet)     │     │
│  └─────────────┘  └──────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Smart Contracts
- **Solidity 0.8.28** - Smart contract language
- **Hardhat** - Development framework
- **@fhevm/solidity 0.9.1** - Zama FHE library
- **OpenZeppelin** - Security standards

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Wagmi + Viem** - Ethereum interactions
- **RainbowKit** - Wallet connection
- **Tailwind CSS** - Styling
- **Sonner** - Toast notifications

### FHE Infrastructure
- **Zama fhEVM** - Fully Homomorphic Encryption
- **Relayer SDK** - Client-side encryption

## Quick Start

### Prerequisites

- Node.js >= 18
- npm or yarn
- MetaMask or compatible wallet
- Sepolia testnet ETH

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd LuckySpin

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install
```

### Configuration

1. Copy environment file:
```bash
cp .env.example .env
```

2. Configure your `.env`:
```env
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### Compile Contracts

```bash
npm run compile
```

### Deploy to Sepolia

```bash
npm run deploy:sepolia
```

### Run Frontend

```bash
cd frontend
npm run dev
```

## Project Structure

```
LuckySpin/
├── contracts/                 # Smart contracts
│   ├── FHELuckySpinV2.sol    # Main spin wheel contract
│   ├── SimpleFHELuckySpin.sol # Simplified version
│   ├── interfaces/            # Contract interfaces
│   │   ├── IPrizeManager.sol
│   │   ├── IRewardDistributor.sol
│   │   ├── ISpinManager.sol
│   │   └── IUserRecords.sol
│   ├── modules/               # Modular contracts
│   │   ├── PrizeManager.sol
│   │   ├── RewardDistributor.sol
│   │   ├── SpinManager.sol
│   │   └── UserRecords.sol
│   └── deployments/           # Deployment artifacts
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── config/           # Contract configs
│   │   ├── contracts/        # ABIs
│   │   ├── hooks/            # React hooks
│   │   ├── lib/              # Utilities (FHE, wagmi)
│   │   └── pages/            # Page components
│   └── index.html
├── scripts/                   # Deployment scripts
│   ├── deploy.js
│   ├── deploy-simple.js
│   └── ...
├── test/                      # Contract tests
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Root dependencies
└── README.md
```

## Contract Functions

### FHELuckySpinV2

| Function | Description |
|----------|-------------|
| `spin(einput, bytes)` | Perform encrypted spin |
| `getSpinResult(address)` | Get user's last spin result |
| `getDailySpins(address)` | Get user's daily spin count |
| `getPrizePool()` | Get current prize pool |
| `getLeaderboard()` | Get top players |

### Prize Tiers

| Tier | Points | Probability |
|------|--------|-------------|
| 1 | 0 | 40% |
| 2 | 100 | 30% |
| 3 | 500 | 15% |
| 4 | 1000 | 10% |
| 5 | 5000 | 5% |

## Development

### Run Tests

```bash
npm run test
```

### Local Development

```bash
# Start local node
npx hardhat node

# Deploy to localhost
npm run deploy:local
```

### Clean Build

```bash
npm run clean
npm run compile
```

## Security Features

- **FHE Encryption**: All spin values encrypted client-side
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Access Control**: Owner-only administrative functions
- **Daily Limits**: Prevents abuse with spin limits
- **Input Validation**: All inputs validated before processing

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
