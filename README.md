# 🎰 FHE Lucky Spin DApp

A privacy-preserving lucky spin game built with Fully Homomorphic Encryption (FHE) technology, powered by Zama's fhEVM protocol. This decentralized application ensures complete fairness and privacy for all players while maintaining full transparency on the blockchain.

## 🎬 Demo Video

> 📹 **[Click here to download the demo video](./docs/demo-test.mp4)** - See the FHE Lucky Spin in action!

The demo video showcases:
- 🔐 **Privacy-preserving gameplay** with FHE encryption
- 🎰 **Live spinning** and result animation
- 🎉 **Success modal** displaying prize results
- 💰 **On-chain transaction** confirmation
- ✨ **Complete user flow** from wallet connection to prize claiming

[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-blue)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22.0-yellow)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 📑 Table of Contents

- [Features](#-features)
- [Demo](#-demo)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Deployment](#-deployment)
- [Usage](#-usage)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🔐 Privacy Protection
- **Fully Homomorphic Encryption**: All spin results are encrypted on-chain using Zama's FHE technology
- **Zero-Knowledge Privacy**: Only you can see your encrypted results
- **Verifiable Fairness**: Results are provably random and tamper-proof

### 🎮 Game Mechanics
- **Points-Based Rewards**: Earn 0-5000 points per spin
- **Daily Limits**: 10 spins per day per address to ensure fair play
- **Multiple Prize Tiers**: 5 different prize levels with varying probabilities
- **Instant Results**: On-chain confirmation in seconds

### 🛡️ Security Features
- **Reentrancy Protection**: OpenZeppelin's ReentrancyGuard
- **Access Control**: Owner-only administrative functions
- **Safe Math**: Built-in overflow protection with Solidity 0.8+
- **Audited Libraries**: Uses battle-tested OpenZeppelin contracts

### 💻 User Experience
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Wallet Integration**: Seamless connection via RainbowKit
- **Real-time Updates**: Live spin counter and points tracking
- **Win History**: Track your last 10 prize wins with timestamps

## 🎬 Demo

**Live Demo**: [Coming Soon]

**Deployed Contract (Sepolia)**: `0x7fe8D79646dF497D82B6703e6CF6Dac9183794e0`

### Screenshots

```
┌─────────────────────────────────────┐
│  🎰 FHE Lucky Spin                  │
│  Privacy-Preserving Blockchain Game │
├─────────────────────────────────────┤
│  Spins Left: 8      Total: 2       │
│  Points: 1500                       │
├─────────────────────────────────────┤
│  [🙏] [💎] [⭐]                     │
│                                     │
│     [ 🎰 SPIN NOW ]                 │
└─────────────────────────────────────┘
```

## 🏗️ Architecture

### Smart Contract Layer

```
┌──────────────────────────────────────┐
│      FHELuckySpinV2.sol              │
├──────────────────────────────────────┤
│  • Ownable (Access Control)          │
│  • ReentrancyGuard (Security)        │
│  • FHE Integration (Privacy)         │
├──────────────────────────────────────┤
│  Core Functions:                     │
│  ├─ spin(handle, proof)              │
│  ├─ getRemainingSpins(user)          │
│  ├─ getUserPoints(user)              │
│  └─ getPrizeInfo(index)              │
└──────────────────────────────────────┘
```

**Technology Stack**:
- **Solidity 0.8.28**: Smart contract language
- **Zama fhEVM**: Fully Homomorphic Encryption library
- **OpenZeppelin**: Security and access control contracts
- **Hardhat**: Development environment and testing framework

### Frontend Application

```
┌──────────────────────────────────────┐
│        React Application             │
├──────────────────────────────────────┤
│  UI Layer                            │
│  ├─ Tailwind CSS                     │
│  ├─ shadcn/ui Components             │
│  └─ Lucide React Icons               │
├──────────────────────────────────────┤
│  Web3 Layer                          │
│  ├─ Wagmi (React Hooks)              │
│  ├─ Viem (Ethereum Interface)        │
│  ├─ RainbowKit (Wallet UI)           │
│  └─ Zama Relayer SDK (FHE Client)    │
└──────────────────────────────────────┘
```

**Technology Stack**:
- **React 18**: UI framework
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Accessible component library
- **Wagmi**: React hooks for Ethereum
- **Viem**: TypeScript interface for Ethereum
- **RainbowKit**: Wallet connection UI
- **Zama Relayer SDK 0.2.0**: FHE encryption client

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher (or **yarn** v1.22.0+)
- **MetaMask** or compatible Web3 wallet
- **Sepolia ETH** for testing (get from [Sepolia Faucet](https://sepoliafaucet.com/))
- **Git** for version control

### Checking Prerequisites

```bash
# Check Node.js version
node --version  # Should be v18+

# Check npm version
npm --version   # Should be v9+

# Check Git
git --version
```

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/lgtixqrmt6/fhe-lucky-spin.git
cd fhe-lucky-spin
```

### 2. Install Smart Contract Dependencies

```bash
cd contracts
npm install

# Or with yarn
yarn install
```

**Dependencies installed**:
- `hardhat`: Development environment
- `@openzeppelin/contracts`: Security contracts
- `fhevm`: Zama FHE library
- `ethers`: Ethereum library
- `chai`: Testing framework

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install

# Or with yarn
yarn install
```

**Dependencies installed**:
- `react` & `react-dom`: UI framework
- `wagmi` & `viem`: Web3 libraries
- `@rainbow-me/rainbowkit`: Wallet UI
- `tailwindcss`: CSS framework
- `lucide-react`: Icon library

## ⚙️ Configuration

### 1. Smart Contract Configuration

Create `.env` file in the `contracts` directory:

```bash
cd contracts
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Sepolia RPC URL (Get from Alchemy or Infura)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Deployer Private Key (NEVER commit this!)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Etherscan API Key (for contract verification)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

⚠️ **Security Warning**: Never commit your `.env` file or share your private key!

### 2. Frontend Configuration

Create `.env` file in the `frontend` directory:

```bash
cd frontend
cp .env.example .env
```

Edit `.env` with contract addresses:

```env
# Contract Addresses (Update after deployment)
VITE_FHE_LUCKY_SPIN_V2_ADDRESS=0x7fe8D79646dF497D82B6703e6CF6Dac9183794e0

# Network Configuration
VITE_SEPOLIA_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# WalletConnect Project ID (Get from https://cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 3. Hardhat Configuration

Review `hardhat.config.js` in contracts directory:

```javascript
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
```

## 🚢 Deployment

### Deploy Smart Contract

#### Step 1: Compile Contracts

```bash
cd contracts
npx hardhat compile
```

Expected output:
```
✓ Compiled 15 Solidity files successfully
```

#### Step 2: Deploy to Sepolia

```bash
SEPOLIA_RPC_URL="your_rpc_url" npx hardhat run scripts/deploy.js --network sepolia
```

Expected output:
```
🚀 Deploying FHELuckySpinV2...
✅ Contract deployed to: 0x7fe8D79646dF497D82B6703e6CF6Dac9183794e0
📝 Save this address to your frontend .env file!
```

#### Step 3: Verify Contract (Optional)

```bash
npx hardhat verify --network sepolia 0x7fe8D79646dF497D82B6703e6CF6Dac9183794e0
```

### Start Frontend Application

#### Development Mode

```bash
cd frontend
npm run dev
```

Application will start at `http://localhost:5173`

#### Production Build

```bash
npm run build
npm run preview
```

## 🎯 Usage

### For Players

#### 1. Connect Your Wallet

1. Click **"Connect Wallet"** button
2. Select your wallet (MetaMask, WalletConnect, etc.)
3. Approve the connection
4. Switch to **Sepolia testnet** if prompted

#### 2. Get Test ETH

Visit [Sepolia Faucet](https://sepoliafaucet.com/) to get free test ETH.

#### 3. Play the Game

1. Click **"SPIN NOW"** button
2. Approve wallet signature (for FHE encryption)
3. Confirm transaction (costs 0.01 ETH + gas)
4. Wait for confirmation (~15 seconds)
5. View your prize and updated points!

#### 4. View Your Stats

- **Spins Left**: Remaining spins today (max 10)
- **Total Spins**: Lifetime spin count
- **Points**: Your accumulated points
- **Win History**: Your last 10 prizes

### For Developers

#### Running Tests

```bash
cd contracts
npm test
```

#### Run Specific Tests

```bash
# Unit tests only
npx hardhat test tests/FHELuckySpinV2.test.js

# Integration tests only
npx hardhat test tests/integration.test.js
```

#### Test with Gas Report

```bash
REPORT_GAS=true npm test
```

#### Test Coverage

```bash
npm run coverage
```

## 🧪 Testing

Comprehensive test suite with 25+ test cases covering:

### Unit Tests (`tests/FHELuckySpinV2.test.js`)

- ✅ Contract deployment
- ✅ Spin functionality
- ✅ Payment validation
- ✅ Daily limits
- ✅ Prize management
- ✅ Access control
- ✅ Event emissions

### Integration Tests (`tests/integration.test.js`)

- ✅ Multi-player scenarios
- ✅ Daily reset behavior
- ✅ Withdrawal flow
- ✅ Edge cases
- ✅ Performance testing

### Running All Tests

```bash
cd contracts
npm test
```

Expected output:
```
  FHELuckySpinV2 Contract Tests
    ✓ Should set the correct owner
    ✓ Should initialize with correct prize configuration
    ✓ Should track spin count correctly
    ... (25+ tests pass)

  25 passing (3.2s)
```

For detailed testing documentation, see [tests/README.md](tests/README.md)

## 📁 Project Structure

```
fhe-lucky-spin/
├── contracts/                          # Smart contracts
│   ├── src/
│   │   ├── FHELuckySpinV2.sol         # Main contract
│   │   ├── interfaces/                 # Contract interfaces
│   │   └── modules/                    # Modular components
│   ├── scripts/
│   │   ├── deploy.js                   # Deployment script
│   │   └── setup-authorizations.js     # Setup script
│   ├── tests/
│   │   ├── FHELuckySpinV2.test.js     # Unit tests
│   │   └── integration.test.js         # Integration tests
│   ├── hardhat.config.js               # Hardhat configuration
│   └── package.json
│
├── frontend/                           # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── SimpleSlotMachine.tsx   # Main game component
│   │   │   ├── Header.tsx              # Navigation header
│   │   │   └── ui/                     # shadcn/ui components
│   │   ├── hooks/
│   │   │   └── useFHELuckySpinSimplified.ts  # Game logic hook
│   │   ├── lib/
│   │   │   └── fhe.ts                  # FHE encryption utilities
│   │   ├── config/
│   │   │   ├── contracts.ts            # Contract addresses & ABIs
│   │   │   └── wagmi.ts                # Web3 configuration
│   │   ├── pages/
│   │   │   └── Index.tsx               # Landing page
│   │   └── App.tsx                     # Root component
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts                  # Vite configuration
│   ├── tailwind.config.ts              # Tailwind configuration
│   └── package.json
│
├── tests/                              # Root-level tests
│   ├── FHELuckySpinV2.test.js         # Shared test file
│   ├── integration.test.js             # Integration tests
│   └── README.md                       # Testing documentation
│
├── DEPLOYMENT_GUIDE.md                 # Deployment instructions
├── PROJECT_SUMMARY.md                  # Project overview
├── README.md                           # This file
└── LICENSE                             # MIT License
```

## 🔧 How It Works

### 1. FHE Encryption Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Player    │     │  Zama SDK    │     │  Contract   │
└──────┬──────┘     └──────┬───────┘     └──────┬──────┘
       │                   │                     │
       │  1. Click Spin    │                     │
       ├──────────────────>│                     │
       │                   │                     │
       │  2. Sign for FHE  │                     │
       │<─────────────────┤│                     │
       │                   │                     │
       │  3. Generate Keys │                     │
       │                   ├───────────          │
       │                   │          │          │
       │                   │<──────────          │
       │                   │                     │
       │  4. Encrypt Data  │                     │
       │                   ├───────────          │
       │                   │          │          │
       │                   │<──────────          │
       │                   │                     │
       │  5. Send TX       │                     │
       ├───────────────────┴────────────────────>│
       │                                         │
       │  6. Store Encrypted Result             │
       │                                    ┌────┤
       │                                    │    │
       │                                    └───>│
       │                                         │
       │  7. Emit Event                          │
       │<────────────────────────────────────────┤
       │                                         │
```

### 2. Prize Selection Algorithm

The contract uses a probability-based system:

```solidity
Prize[] public prizes = [
    Prize("Thank You", 0, 40, true),      // 40% chance
    Prize("100 Points", 100, 30, true),    // 30% chance
    Prize("500 Points", 500, 20, true),    // 20% chance
    Prize("1000 Points", 1000, 8, true),   // 8% chance
    Prize("5000 Points", 5000, 2, true)    // 2% chance
];
```

### 3. Daily Limit Mechanism

```solidity
function getRemainingSpins(address user) public view returns (uint256) {
    UserSpinData storage userData = userSpins[user];

    // Reset if new day
    if (block.timestamp >= userData.lastResetTime + 1 days) {
        return MAX_DAILY_SPINS;
    }

    // Calculate remaining
    if (userData.dailySpins >= MAX_DAILY_SPINS) {
        return 0;
    }

    return MAX_DAILY_SPINS - userData.dailySpins;
}
```

## 🔒 Security

### Audit Status

⚠️ **Not Audited**: This contract has not undergone a professional security audit. Use at your own risk in production.

### Security Features

1. **Access Control**: Owner-only administrative functions
2. **Reentrancy Protection**: OpenZeppelin's ReentrancyGuard
3. **Safe Math**: Solidity 0.8+ built-in overflow protection
4. **Input Validation**: All user inputs are validated
5. **FHE Encryption**: Results protected with homomorphic encryption

### Best Practices Implemented

- ✅ Follow CEI (Checks-Effects-Interactions) pattern
- ✅ Use OpenZeppelin audited contracts
- ✅ Implement proper access controls
- ✅ Add event logging for all state changes
- ✅ Validate all external inputs
- ✅ Protect against common vulnerabilities

### Known Limitations

1. **FHE Mock**: Current implementation uses mock FHE for testing
2. **Sepolia Only**: Designed for testnet use
3. **Daily Reset**: Based on block timestamp (manipulatable by miners)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

### 1. Fork the Repository

```bash
git fork https://github.com/lgtixqrmt6/fhe-lucky-spin.git
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/amazing-feature
```

### 3. Make Your Changes

- Write clean, documented code
- Add tests for new features
- Follow existing code style
- Update documentation

### 4. Run Tests

```bash
cd contracts
npm test
```

### 5. Commit Your Changes

```bash
git commit -m "Add amazing feature"
```

### 6. Push to Your Fork

```bash
git push origin feature/amazing-feature
```

### 7. Open a Pull Request

Go to GitHub and create a pull request with:
- Clear description of changes
- Link to related issues
- Screenshots (if UI changes)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 FHE Lucky Spin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

## 🔗 Links & Resources

### Official Documentation
- [Zama Documentation](https://docs.zama.ai/)
- [fhEVM SDK](https://github.com/zama-ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [React Documentation](https://react.dev/)

### Tools & Services
- [Sepolia Testnet Explorer](https://sepolia.etherscan.io/)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [WalletConnect Cloud](https://cloud.walletconnect.com/)
- [Alchemy Dashboard](https://dashboard.alchemy.com/)

### Community
- [GitHub Issues](https://github.com/lgtixqrmt6/fhe-lucky-spin/issues)
- [GitHub Discussions](https://github.com/lgtixqrmt6/fhe-lucky-spin/discussions)

## 💬 Support

Need help? Here's how to get support:

1. **Documentation**: Check this README and other docs first
2. **Issues**: [Open an issue](https://github.com/lgtixqrmt6/fhe-lucky-spin/issues) for bugs
3. **Discussions**: [Start a discussion](https://github.com/lgtixqrmt6/fhe-lucky-spin/discussions) for questions

## 🙏 Acknowledgments

- **Zama Team**: For the amazing FHE technology
- **OpenZeppelin**: For secure smart contract libraries
- **Hardhat Team**: For the excellent development environment
- **React Community**: For the modern UI framework
- **shadcn**: For beautiful UI components

---

**Built with ❤️ using Zama FHE Technology**

⭐ Star this repo if you find it helpful!
