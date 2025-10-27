const hre = require("hardhat");

async function main() {
  console.log("========================================");
  console.log("Deploying Simplified FHE Lucky Spin");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy single contract
  console.log("📦 Deploying FHELuckySpinV2 (Simplified)...");
  const FHELuckySpinV2 = await hre.ethers.getContractFactory("FHELuckySpinV2");
  const contract = await FHELuckySpinV2.deploy(
    "0xDaE0bC40899B0b9ddf09f80aCe5B1e6cc7856627", // PrizeManager
    "0xA3FbB1676e824c594d9aD313EED7C110AfE87517", // SpinManager
    "0x763c4feF42D9B469D394772e0DbD3C40337dd07F", // UserRecords
    "0x95BdAddCF78e54B2D5d49a1d53c8749087916414"  // RewardDistributor
  );
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("✅ Contract deployed to:", address);
  console.log("\n========================================");
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("========================================");
  console.log("\nUpdate frontend .env:");
  console.log(`VITE_FHE_LUCKY_SPIN_V2_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
