# FHE Lucky Spin - Frontend

A privacy-preserving lucky spin game built with Fully Homomorphic Encryption (FHE) using Zama's fhEVM technology.

## Features

- 🎰 Privacy-preserving lucky spin game with encrypted results
- 🔐 Fully Homomorphic Encryption using Zama's fhEVM
- 🎨 Modern UI with shadcn/ui and Tailwind CSS
- 🌈 RainbowKit wallet integration
- ⚡ Vite for fast development and optimized builds

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **shadcn/ui** - UI component library
- **Tailwind CSS** - Styling
- **RainbowKit** - Wallet connection
- **Wagmi v2** - React hooks for Ethereum
- **Zama Relayer SDK** - Client-side FHE encryption (loaded via CDN)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### Build

```bash
npm run build
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_PRIZE_MANAGER_ADDRESS=0x...
VITE_SPIN_MANAGER_ADDRESS=0x...
VITE_USER_RECORDS_ADDRESS=0x...
VITE_REWARD_DISTRIBUTOR_ADDRESS=0x...
VITE_FHE_LUCKY_SPIN_V2_ADDRESS=0x...
VITE_SEPOLIA_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── lib/            # Utility functions and FHE helpers
├── pages/          # Page components
└── contracts/      # Contract ABIs and addresses
```

## License

MIT
