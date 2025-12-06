const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("FHE Lucky Spin V2 - Deployment Script");
  console.log("========================================\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  if (balance < hre.ethers.parseEther("0.15")) {
    console.warn("⚠️  WARNING: Account balance is low. You need at least 0.15 ETH for deployment.");
    console.warn("   Get testnet ETH from: https://sepoliafaucet.com\n");
  }

  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {},
  };

  // Step 1: Deploy PrizeManager
  console.log("📦 Step 1/5: Deploying PrizeManager...");
  const PrizeManager = await hre.ethers.getContractFactory("PrizeManager");
  const prizeManager = await PrizeManager.deploy();
  await prizeManager.waitForDeployment();
  const prizeManagerAddress = await prizeManager.getAddress();
  console.log("✅ PrizeManager deployed to:", prizeManagerAddress);
  deploymentInfo.contracts.PrizeManager = prizeManagerAddress;

  // Step 2: Deploy SpinManager
  console.log("\n📦 Step 2/5: Deploying SpinManager...");
  const SpinManager = await hre.ethers.getContractFactory("SpinManager");
  const spinManager = await SpinManager.deploy();
  await spinManager.waitForDeployment();
  const spinManagerAddress = await spinManager.getAddress();
  console.log("✅ SpinManager deployed to:", spinManagerAddress);
  deploymentInfo.contracts.SpinManager = spinManagerAddress;

  // Step 3: Deploy UserRecords
  console.log("\n📦 Step 3/5: Deploying UserRecords...");
  const UserRecords = await hre.ethers.getContractFactory("UserRecords");
  const userRecords = await UserRecords.deploy();
  await userRecords.waitForDeployment();
  const userRecordsAddress = await userRecords.getAddress();
  console.log("✅ UserRecords deployed to:", userRecordsAddress);
  deploymentInfo.contracts.UserRecords = userRecordsAddress;

  // Step 4: Deploy RewardDistributor
  console.log("\n📦 Step 4/5: Deploying RewardDistributor...");
  const RewardDistributor = await hre.ethers.getContractFactory("RewardDistributor");
  const rewardDistributor = await RewardDistributor.deploy();
  await rewardDistributor.waitForDeployment();
  const rewardDistributorAddress = await rewardDistributor.getAddress();
  console.log("✅ RewardDistributor deployed to:", rewardDistributorAddress);
  deploymentInfo.contracts.RewardDistributor = rewardDistributorAddress;

  // Step 5: Deploy FHELuckySpinV2 (Main Contract)
  console.log("\n📦 Step 5/5: Deploying FHELuckySpinV2 (Main Contract)...");
  const FHELuckySpinV2 = await hre.ethers.getContractFactory("FHELuckySpinV2");
  const fheLuckySpin = await FHELuckySpinV2.deploy(
    prizeManagerAddress,
    spinManagerAddress,
    userRecordsAddress,
    rewardDistributorAddress
  );
  await fheLuckySpin.waitForDeployment();
  const fheLuckySpinAddress = await fheLuckySpin.getAddress();
  console.log("✅ FHELuckySpinV2 deployed to:", fheLuckySpinAddress);
  deploymentInfo.contracts.FHELuckySpinV2 = fheLuckySpinAddress;

  // Step 6: Set up authorizations
  console.log("\n🔐 Setting up contract authorizations...");

  console.log("  → Authorizing FHELuckySpinV2 in PrizeManager...");
  await prizeManager.setAuthorization(fheLuckySpinAddress, true);

  console.log("  → Setting PrizeManager in SpinManager...");
  await spinManager.setPrizeManager(prizeManagerAddress);

  console.log("  → Authorizing FHELuckySpinV2 in SpinManager...");
  await spinManager.setAuthorization(fheLuckySpinAddress, true);

  console.log("  → Authorizing FHELuckySpinV2 in UserRecords...");
  await userRecords.setAuthorization(fheLuckySpinAddress, true);

  console.log("  → Authorizing FHELuckySpinV2 in RewardDistributor...");
  await rewardDistributor.setAuthorization(fheLuckySpinAddress, true);

  console.log("✅ All authorizations set up successfully!");

  // Step 7: Fund RewardDistributor (if specified in env)
  const initialFunding = process.env.INITIAL_PRIZE_POOL;
  if (initialFunding && parseFloat(initialFunding) > 0) {
    console.log(`\n💰 Funding RewardDistributor with ${initialFunding} ETH...`);
    const tx = await deployer.sendTransaction({
      to: rewardDistributorAddress,
      value: hre.ethers.parseEther(initialFunding),
    });
    await tx.wait();
    console.log("✅ RewardDistributor funded successfully!");
    deploymentInfo.initialFunding = initialFunding;
  }

  // Step 8: Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const prizeCount = await fheLuckySpin.getPrizeCount();
  const spinCost = await fheLuckySpin.getGlobalStats();
  console.log("  → Prize count:", prizeCount.toString());
  console.log("  → Spin cost:", hre.ethers.formatEther(spinCost[3]), "ETH");
  console.log("  → Contract balance:", hre.ethers.formatEther(spinCost[2]), "ETH");

  // Step 9: Save deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📄 Deployment info saved to:", deploymentFile);

  // Step 10: Update frontend .env
  const frontendEnvPath = path.join(__dirname, "..", "..", "frontend", ".env");
  let envContent = "";

  if (fs.existsSync(frontendEnvPath)) {
    envContent = fs.readFileSync(frontendEnvPath, "utf8");
  }

  const updateEnvVar = (content, key, value) => {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      return content.replace(regex, `${key}=${value}`);
    } else {
      return content + `\n${key}=${value}`;
    }
  };

  envContent = updateEnvVar(envContent, "VITE_FHE_LUCKY_SPIN_V2_ADDRESS", fheLuckySpinAddress);
  envContent = updateEnvVar(envContent, "VITE_PRIZE_MANAGER_ADDRESS", prizeManagerAddress);
  envContent = updateEnvVar(envContent, "VITE_SPIN_MANAGER_ADDRESS", spinManagerAddress);
  envContent = updateEnvVar(envContent, "VITE_USER_RECORDS_ADDRESS", userRecordsAddress);
  envContent = updateEnvVar(envContent, "VITE_REWARD_DISTRIBUTOR_ADDRESS", rewardDistributorAddress);
  envContent = updateEnvVar(envContent, "VITE_SEPOLIA_CHAIN_ID", "11155111");
  envContent = updateEnvVar(envContent, "VITE_SEPOLIA_RPC_URL", process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com");

  fs.writeFileSync(frontendEnvPath, envContent.trim() + "\n");
  console.log("📝 Frontend .env updated with contract addresses");

  // Summary
  console.log("\n========================================");
  console.log("✅ DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("========================================");
  console.log("\nContract Addresses:");
  console.log("  PrizeManager:       ", prizeManagerAddress);
  console.log("  SpinManager:        ", spinManagerAddress);
  console.log("  UserRecords:        ", userRecordsAddress);
  console.log("  RewardDistributor:  ", rewardDistributorAddress);
  console.log("  FHELuckySpinV2:     ", fheLuckySpinAddress);

  console.log("\n📋 Next Steps:");
  console.log("  1. Verify contracts on Etherscan (optional):");
  console.log("     npx hardhat verify --network sepolia", prizeManagerAddress);
  console.log("     npx hardhat verify --network sepolia", spinManagerAddress);
  console.log("     npx hardhat verify --network sepolia", userRecordsAddress);
  console.log("     npx hardhat verify --network sepolia", rewardDistributorAddress);
  console.log("     npx hardhat verify --network sepolia", fheLuckySpinAddress,
              prizeManagerAddress, spinManagerAddress, userRecordsAddress, rewardDistributorAddress);
  console.log("\n  2. Fund the RewardDistributor with ETH for prizes if not already done");
  console.log("\n  3. Deploy frontend with updated contract addresses");
  console.log("\n  4. Test the application on Sepolia testnet");
  console.log("\n========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
