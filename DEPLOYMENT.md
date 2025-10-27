# FHE Lucky Spin - Deployment Information

## 🚀 Live Deployment

**Production URL**: https://fhe-lucky-spin.vercel.app

**Alternative URL**: https://fhe-lucky-spin-a259ky9zb-songsus-projects.vercel.app

## 📦 Deployment Details

- **Platform**: Vercel
- **Framework**: Vite + React + TypeScript
- **Build Command**: `vite build`
- **Output Directory**: `dist`
- **Deployment Date**: October 28, 2024

## 🔧 Smart Contract Information

**Network**: Sepolia Testnet

**Deployed Contracts**:
- **FHELuckySpinV2**: `0x7fe8D79646dF497D82B6703e6CF6Dac9183794e0`
- **PrizeManager**: `0xDaE0bC40899B0b9ddf09f80aCe5B1e6cc7856627`
- **SpinManager**: `0xA3FbB1676e824c594d9aD313EED7C110AfE87517`
- **UserRecords**: `0x763c4feF42D9B469D394772e0DbD3C40337dd07F`
- **RewardDistributor**: `0x95BdAddCF78e54B2D5d49a1d53c8749087916414`

## 🎮 How to Use

1. Visit https://fhe-lucky-spin.vercel.app
2. Connect your Web3 wallet (MetaMask recommended)
3. Switch to Sepolia testnet
4. Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
5. Click "SPIN NOW" to play!

## 🔄 Redeployment

To redeploy the application:

```bash
cd frontend
npm run build
VERCEL_TOKEN="your_token" vercel --prod --yes
```

## 📊 Features

- ✅ Privacy-preserving gameplay with FHE encryption
- ✅ 5 prize tiers (0-5000 points)
- ✅ Daily limit: 10 spins per address
- ✅ Win history tracking (last 10 spins)
- ✅ Real-time points balance
- ✅ Responsive design for all devices

## 🔍 Monitoring

**Vercel Dashboard**: https://vercel.com/songsus-projects/fhe-lucky-spin

**Etherscan (Sepolia)**: https://sepolia.etherscan.io/address/0x7fe8D79646dF497D82B6703e6CF6Dac9183794e0

## 🛠️ Technical Stack

**Frontend**:
- React 18
- TypeScript
- Tailwind CSS + shadcn/ui
- Wagmi + Viem
- RainbowKit
- Zama Relayer SDK 0.2.0

**Smart Contracts**:
- Solidity 0.8.28
- Zama fhEVM
- OpenZeppelin
- Hardhat

## 📝 Environment Variables

The following environment variables are configured in Vercel:

```env
VITE_FHE_LUCKY_SPIN_V2_ADDRESS=0x7fe8D79646dF497D82B6703e6CF6Dac9183794e0
VITE_SEPOLIA_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

## 🔒 Security Notes

- All transactions are verified on Sepolia testnet
- FHE encryption ensures result privacy
- Smart contracts use OpenZeppelin security libraries
- Daily spin limits prevent abuse

## 💡 Support

For issues or questions:
- GitHub Issues: https://github.com/lgtixqrmt6/fhe-lucky-spin/issues
- GitHub Repo: https://github.com/lgtixqrmt6/fhe-lucky-spin

---

**Last Updated**: October 28, 2024
**Deployed By**: czehd8qclm6y
