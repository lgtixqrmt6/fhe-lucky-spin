# FHE Lucky Spin DApp

A privacy-preserving lucky spin game using Fully Homomorphic Encryption (FHE) technology, leveraging the Zama protocol to ensure game fairness and user privacy.

## 🎯 Project Features

- **Privacy Protection**: Uses FHE technology to keep spin results encrypted on-chain
- **Fair & Transparent**: Ensures game fairness through FHE verification while protecting user privacy
- **Daily Limits**: Maximum 3 spins per day per person to prevent excessive gaming
- **Real-time Rewards**: Immediate prize claiming to wallet after winning

## 🏗️ Technical Architecture

### Smart Contracts
- **Solidity**: Developed with Solidity 0.8.28
- **FHE Integration**: Implements encrypted computation using Zama fhEVM library
- **OpenZeppelin**: Uses mature access control and reentrancy protection
- **Network**: Deployed on Sepolia testnet

### Frontend Application
- **React 18**: Modern React application
- **TypeScript**: Type-safe development experience
- **Ant Design**: Beautiful UI component library
- **Framer Motion**: Smooth animation effects
- **Ethers.js**: Web3 interaction library

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask wallet
- Sepolia testnet ETH

### Install Dependencies

```bash
# Install smart contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configure Environment

1. Copy environment variable files:
```bash
cd frontend
cp env.example .env.local
```

2. Update environment variables:
```bash
# Set in .env.local
VITE_CONTRACT_ADDRESS=your_contract_address
VITE_INFURA_API_KEY=your_infura_api_key
```

### Deploy Smart Contract

```bash
cd contracts

# Set environment variables
export SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
export DEPLOYER_PRIVATE_KEY="your_private_key"

# Deploy to Sepolia
npm run deploy:sepolia
```

### Start Frontend

```bash
cd frontend
npm run dev
```

Visit http://localhost:3000 to start playing!

## 🎮 How to Play

1. **Connect Wallet**: Use MetaMask to connect to Sepolia network
2. **View Prizes**: Browse available prizes and their probabilities
3. **Start Spinning**: Pay 0.001 ETH fee to spin the wheel
4. **View Results**: Spin results are protected with FHE encryption
5. **Claim Prizes**: Manually claim prizes to wallet after winning

## 🏆 Prize Settings

| Prize | Probability | Value |
|-------|-------------|-------|
| Thank You | 50% | 0 ETH |
| Small Prize | 30% | 0.01 ETH |
| Medium Prize | 15% | 0.05 ETH |
| Big Prize | 4% | 0.1 ETH |
| Grand Prize | 1% | 0.5 ETH |

## 🔒 Privacy Protection Mechanism

### FHE Encryption Process
1. User generates and encrypts random number
2. Smart contract receives encrypted random number
3. Calculate spin result in encrypted state
4. Result remains encrypted in storage
5. User decrypts to view result

### Security Features
- Spin results are completely encrypted on-chain
- Only users can decrypt and view results
- Uses Zama protocol to ensure computational correctness
- Prevents replay attacks and manipulation

## 🧪 Testing

### Smart Contract Testing
```bash
cd contracts
npm test
```

### Frontend Testing
```bash
cd frontend
npm run test
```

## 📁 Project Structure

```
fhe-payroll/
├── contracts/                 # Smart contracts
│   ├── src/
│   │   └── FHELuckySpin.sol  # Main contract
│   ├── scripts/
│   │   └── deploy.js         # Deployment script
│   ├── test/
│   │   └── FHELuckySpin.test.js
│   └── package.json
├── frontend/                  # Frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── types/           # TypeScript types
│   │   └── config/          # Configuration files
│   └── package.json
└── README.md
```

## 🔧 Development Guide

### Smart Contract Development
- Follow Solidity best practices
- Use OpenZeppelin security libraries
- Properly implement FHE operations
- Add comprehensive error handling

### Frontend Development
- Use TypeScript for type safety
- Follow React Hooks best practices
- Implement responsive design
- Add appropriate error handling

## 🚨 Important Notes

1. **Network Requirements**: Must run on Sepolia testnet
2. **FHE Initialization**: First-time use requires FHE environment initialization
3. **Gas Fees**: Spin operations require gas fee payment
4. **Private Key Security**: Keep private keys secure and never commit to repository

## 🤝 Contributing

Welcome to submit Issues and Pull Requests to improve the project!

## 📄 License

MIT License

## 🔗 Related Links

- [Zama Protocol Documentation](https://docs.zama.ai/)
- [fhEVM SDK](https://github.com/zama-ai/fhevm)
- [Sepolia Testnet](https://sepolia.etherscan.io/)
- [MetaMask Wallet](https://metamask.io/)