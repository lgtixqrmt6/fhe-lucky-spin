# FHE Lucky Spin

A privacy-preserving blockchain lottery game built with **Fully Homomorphic Encryption (FHE)** technology, powered by Zama's fhEVM protocol on Ethereum Sepolia testnet.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-blue)](https://docs.soliditylang.org)
[![fhEVM](https://img.shields.io/badge/fhEVM-0.9.1-purple)](https://docs.zama.ai/fhevm)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.26.3-yellow)](https://hardhat.org)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb)](https://react.dev)

## Live Demo

- **Frontend**: [Deployed on Vercel](https://lucky-spin.vercel.app)
- **Contract**: [`0x064bc936B520902F1dbc7E9E9eA636aCF1B82128`](https://sepolia.etherscan.io/address/0x064bc936B520902F1dbc7E9E9eA636aCF1B82128)
- **Network**: Ethereum Sepolia Testnet (Chain ID: 11155111)

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technical Architecture](#technical-architecture)
- [FHE Deep Dive](#fhe-deep-dive)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Smart Contract API](#smart-contract-api)
- [Frontend Architecture](#frontend-architecture)
- [Security Considerations](#security-considerations)
- [Development](#development)
- [License](#license)

## Overview

**FHE Lucky Spin** is a next-generation decentralized lottery application that leverages Fully Homomorphic Encryption to provide unprecedented privacy guarantees. Unlike traditional blockchain games where all data is publicly visible, our system ensures complete privacy while maintaining verifiable fairness.

### Why FHE Matters

Traditional blockchain transparency creates a paradox for gaming applications:
- All transaction data is publicly visible
- Random number generation can be predicted or manipulated
- User behavior patterns are exposed to analysis

FHE solves these problems by enabling **computation on encrypted data** - the blockchain processes your spin without ever seeing the actual values.

## Key Features

| Feature | Description |
|---------|-------------|
| **Privacy-Preserving Spins** | Prize selection encrypted with FHE, invisible to observers |
| **Client-Side Encryption** | Data encrypted in browser before blockchain submission |
| **Verifiable Fairness** | On-chain processing ensures tamper-proof results |
| **Real-Time Notifications** | Toast system with Etherscan transaction links |
| **Daily Spin Limits** | 10 spins per day per address for fair distribution |
| **Points-Based Rewards** | Five prize tiers from 0 to 5000 points |

### Prize Distribution

| Prize | Emoji | Points | Probability |
|-------|-------|--------|-------------|
| Thank You | 🙏 | 0 | 40% |
| Small Win | 💎 | 100 | 30% |
| Medium Win | ⭐ | 500 | 20% |
| Big Win | 💰 | 1000 | 8% |
| Jackpot | 🎁 | 5000 | 2% |

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    React Frontend (Vite)                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │   │
│  │  │ SlotMachine  │  │  Toast       │  │  Wallet Connection   │  │   │
│  │  │ Component    │  │  Notifications│  │  (RainbowKit)        │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      ENCRYPTION LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              Zama fhEVM SDK (Client-Side)                        │   │
│  │  ┌──────────────────┐  ┌────────────────────────────────────┐  │   │
│  │  │ encryptUint8()   │  │ Proof Generation (ZKP)              │  │   │
│  │  │ Random Value Gen │  │ Handle + Proof → Contract           │  │   │
│  │  └──────────────────┘  └────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN LAYER (Sepolia)                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │           SimpleFHELuckySpin Contract                            │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │   │
│  │  │ spin()           │  │ FHE Operations   │  │ User Records │  │   │
│  │  │ Accepts encrypted│  │ euint8 storage   │  │ Spin counts  │  │   │
│  │  │ prize index      │  │ Prize mapping    │  │ Daily limits │  │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              Zama Coprocessor (FHE Operations)                   │   │
│  │  • Encrypted arithmetic on euint8 values                         │   │
│  │  • TFHE.asEuint8() conversion                                    │   │
│  │  • Encrypted comparisons and branching                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Sequence

```
1. User Click "SPIN"
   │
   ├─► Frontend: Generate random prize index (0-4) based on probabilities
   │
   ├─► FHE SDK: encryptUint8(prizeIndex, contractAddress, userAddress)
   │   └─► Returns: { handle: einput, proof: bytes }
   │
   ├─► Wagmi: writeContractAsync({ args: [handle, proof], value: 0.01 ETH })
   │
   ├─► Contract: spin(einput encryptedPrize, bytes proof)
   │   ├─► TFHE.asEuint8(encryptedPrize, proof) → euint8
   │   ├─► Validate daily limit (max 10 spins)
   │   ├─► Store encrypted result
   │   ├─► Update user spin count
   │   └─► Emit SpinResult event
   │
   ├─► Frontend: useWaitForTransactionReceipt monitors confirmation
   │   ├─► Pending: toastTxPending(txHash) with Etherscan link
   │   ├─► Success: toastTxSuccess(txHash) + Show prize modal
   │   └─► Error: toastTxError(txHash, error)
   │
   └─► User sees animated result + transaction confirmation
```

## FHE Deep Dive

### What is Fully Homomorphic Encryption?

FHE allows computations on encrypted data without decryption. The result, when decrypted, matches the result of the same computation on plaintext data.

```
Plaintext Operation:     5 + 3 = 8
FHE Equivalent:          Encrypt(5) ⊕ Encrypt(3) = Encrypt(8)
                         Decrypt(Encrypt(8)) = 8
```

### Zama fhEVM Integration

Our contract uses Zama's fhEVM 0.9.1 which provides:

```solidity
// Contract inherits FHE capabilities
contract SimpleFHELuckySpin is SepoliaZamaFHEVMConfig {

    // Store encrypted prize for each user's spin
    mapping(address => euint8) private userLastPrize;

    function spin(einput encryptedPrize, bytes calldata proof) external payable {
        // Convert client-encrypted input to on-chain encrypted type
        euint8 prize = TFHE.asEuint8(encryptedPrize, proof);

        // Store encrypted - contract never sees actual value
        userLastPrize[msg.sender] = prize;

        // Grant decryption permission to user
        TFHE.allow(prize, msg.sender);
    }
}
```

### Security Properties

| Property | Guarantee |
|----------|-----------|
| **Confidentiality** | Prize values never exposed on-chain in plaintext |
| **Integrity** | TFHE operations preserve mathematical correctness |
| **Verifiability** | Zero-knowledge proofs validate encryption |
| **Non-Malleability** | Encrypted values cannot be modified without detection |

## Tech Stack

### Smart Contracts

| Package | Version | Purpose |
|---------|---------|---------|
| Solidity | 0.8.28 | Smart contract language |
| @fhevm/solidity | 0.9.1 | Zama FHE library |
| @fhevm/hardhat-plugin | 0.3.0-1 | Hardhat FHE integration |
| Hardhat | 2.26.3 | Development framework |
| @openzeppelin/contracts | 5.4.0 | Security standards |
| ethers | 6.13.4 | Ethereum interactions |

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.3.1 | UI framework |
| Vite | 5.4.19 | Build tool |
| wagmi | 2.18.2 | React hooks for Ethereum |
| viem | 2.38.4 | TypeScript Ethereum library |
| @rainbow-me/rainbowkit | 2.2.9 | Wallet connection |
| @tanstack/react-query | 5.90.5 | Async state management |
| Tailwind CSS | 3.4.17 | Utility-first CSS |
| sonner | 1.7.4 | Toast notifications |
| TypeScript | 5.8.3 | Type safety |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Ethereum Sepolia | Test network |
| Zama Coprocessor | FHE computation |
| Vercel | Frontend hosting |
| Etherscan | Block explorer |

## Quick Start

### Prerequisites

- Node.js >= 18
- npm or yarn
- MetaMask or compatible wallet
- Sepolia testnet ETH ([Faucet](https://sepoliafaucet.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/LuckySpin.git
cd LuckySpin

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install
```

### Environment Configuration

1. Create root `.env`:
```env
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=your_deployer_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

2. Create `frontend/.env`:
```env
VITE_SIMPLE_FHE_LUCKY_SPIN_ADDRESS=0x064bc936B520902F1dbc7E9E9eA636aCF1B82128
VITE_SEPOLIA_CHAIN_ID=11155111
```

### Compile & Deploy

```bash
# Compile contracts
npm run compile

# Deploy to Sepolia
npm run deploy:simple

# Run tests
npm run test:all
```

### Run Frontend

```bash
cd frontend
npm run dev
# Open http://localhost:5173
```

## Project Structure

```
LuckySpin/
├── contracts/                    # Solidity smart contracts
│   ├── SimpleFHELuckySpin.sol   # Main contract (deployed)
│   ├── FHELuckySpinV2.sol       # Advanced version with claims
│   ├── interfaces/               # Contract interfaces
│   │   ├── IPrizeManager.sol
│   │   ├── IRewardDistributor.sol
│   │   ├── ISpinManager.sol
│   │   └── IUserRecords.sol
│   ├── modules/                  # Modular contract components
│   │   ├── PrizeManager.sol
│   │   ├── RewardDistributor.sol
│   │   ├── SpinManager.sol
│   │   └── UserRecords.sol
│   └── deployments/              # Deployment records
│       └── simple-sepolia.json
│
├── frontend/                     # React TypeScript frontend
│   ├── src/
│   │   ├── components/          # UI components
│   │   │   ├── SimpleSlotMachine.tsx  # Main game UI
│   │   │   ├── SlotMachine.tsx        # Advanced UI
│   │   │   └── ui/                    # Shadcn/ui components
│   │   ├── config/
│   │   │   └── contracts.ts     # Contract addresses & config
│   │   ├── contracts/           # ABI JSON files
│   │   │   └── SimpleFHELuckySpin.json
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useFHELuckySpinSimplified.ts
│   │   │   └── useFHELuckySpin.ts
│   │   ├── lib/
│   │   │   ├── fhe.ts           # FHE encryption utilities
│   │   │   ├── wagmi.ts         # Wagmi configuration
│   │   │   └── toast-utils.ts   # Toast notification helpers
│   │   └── pages/
│   │       └── Home.tsx
│   ├── index.html
│   └── package.json
│
├── scripts/                      # Deployment scripts
│   ├── deploy.js                # V2 deployment
│   └── deploy-simple.js         # Simple version deployment
│
├── test/                         # Contract unit tests
│   ├── SimpleFHELuckySpin.test.js
│   ├── FHELuckySpinV2.test.js
│   ├── SpinManager.test.js
│   ├── PrizeManager.test.js
│   ├── RewardDistributor.test.js
│   └── UserRecords.test.js
│
├── hardhat.config.js            # Hardhat configuration
├── package.json                 # Root dependencies
└── README.md
```

## Smart Contract API

### SimpleFHELuckySpin

**Deployed Address**: `0x064bc936B520902F1dbc7E9E9eA636aCF1B82128`

#### Write Functions

| Function | Parameters | Description |
|----------|------------|-------------|
| `spin` | `einput encryptedPrize, bytes proof` | Submit encrypted spin, costs 0.01 ETH |
| `depositFunds` | - | Owner deposits ETH to prize pool |
| `withdrawFunds` | `uint256 amount` | Owner withdraws from prize pool |

#### Read Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `getRemainingSpins(address)` | `uint256` | Spins left today (max 10) |
| `getUserSpinCount(address)` | `uint256` | Total lifetime spins |
| `getContractBalance()` | `uint256` | Current prize pool balance |
| `SPIN_COST()` | `uint256` | Cost per spin (0.01 ETH) |
| `MAX_DAILY_SPINS()` | `uint256` | Daily limit (10) |

#### Events

```solidity
event SpinResult(address indexed player, uint256 timestamp);
event FundsDeposited(address indexed depositor, uint256 amount);
event FundsWithdrawn(address indexed owner, uint256 amount);
```

## Frontend Architecture

### Hook Pattern

The frontend uses custom hooks for clean separation of concerns:

```typescript
// useFHELuckySpinSimplified.ts
export function useFHELuckySpinSimplified() {
  const { address } = useAccount();
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<number | null>(null);

  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt({ hash });

  const spin = useCallback(async () => {
    // 1. Select prize based on probability
    const prizeIndex = selectPrize();

    // 2. Encrypt with FHE
    const encrypted = await encryptUint8(prizeIndex, contractAddress, address, provider);

    // 3. Submit to blockchain
    await writeContractAsync({
      args: [encrypted.handle, encrypted.proof],
      value: parseEther('0.01'),
    });
  }, [address, writeContractAsync]);

  return { spin, isEncrypting, isConfirming: isLoading, isConfirmed: isSuccess, ... };
}
```

### Toast Notification System

Real-time transaction feedback with Etherscan links:

```typescript
// toast-utils.ts
export const toastTxPending = (hash: string) => {
  toast.loading('Transaction pending...', {
    action: {
      label: 'View',
      onClick: () => window.open(`https://sepolia.etherscan.io/tx/${hash}`),
    },
  });
};

export const toastTxSuccess = (hash: string, message: string) => {
  toast.success(message, {
    action: {
      label: 'View',
      onClick: () => window.open(`https://sepolia.etherscan.io/tx/${hash}`),
    },
  });
};
```

## Security Considerations

### Smart Contract Security

| Protection | Implementation |
|------------|----------------|
| **Reentrancy Guard** | OpenZeppelin ReentrancyGuard on all state-changing functions |
| **Access Control** | Ownable pattern for admin functions |
| **Input Validation** | FHE proof verification via TFHE.asEuint8 |
| **Rate Limiting** | Daily spin limit (10 per address) |
| **Safe Math** | Solidity 0.8+ built-in overflow protection |

### Frontend Security

| Protection | Implementation |
|------------|----------------|
| **Wallet Validation** | Address check before all operations |
| **Transaction Monitoring** | useWaitForTransactionReceipt for confirmation |
| **Error Handling** | Comprehensive error messages with user-friendly toasts |
| **State Management** | processedTxHash prevents duplicate processing |

## Development

### Available Scripts

```bash
# Root directory
npm run compile          # Compile all contracts
npm run deploy:sepolia   # Deploy V2 to Sepolia
npm run deploy:simple    # Deploy Simple version to Sepolia
npm run test             # Run all tests
npm run test:simple      # Test SimpleFHELuckySpin
npm run test:all         # Run all unit tests
npm run clean            # Clean build artifacts

# Frontend directory
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # ESLint check
```

### Testing

Unit tests cover all contract modules:

```bash
npm run test:all

# Individual module tests
npm run test:simple      # SimpleFHELuckySpin
npm run test:spin        # SpinManager
npm run test:prize       # PrizeManager
npm run test:reward      # RewardDistributor
npm run test:user        # UserRecords
npm run test:v2          # FHELuckySpinV2
```

### Deployment

```bash
# Deploy to Sepolia
npm run deploy:simple

# Output saved to contracts/deployments/simple-sepolia.json
# Update frontend/.env with new contract address
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with [Zama fhEVM](https://docs.zama.ai/fhevm) | Deployed on [Ethereum Sepolia](https://sepolia.etherscan.io)
