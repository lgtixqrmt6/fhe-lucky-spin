const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("Simple FHE Lucky Spin - Deployment Script");
  console.log("========================================\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  if (balance < hre.ethers.parseEther("0.05")) {
    console.warn("⚠️  WARNING: Account balance is low. You need at least 0.05 ETH for deployment.");
    console.warn("   Get testnet ETH from: https://sepoliafaucet.com\n");
  }

  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {},
  };

  // Deploy SimpleFHELuckySpin
  console.log("📦 Deploying SimpleFHELuckySpin...");
  const SimpleFHELuckySpin = await hre.ethers.getContractFactory("SimpleFHELuckySpin");
  const simpleLuckySpin = await SimpleFHELuckySpin.deploy();
  await simpleLuckySpin.waitForDeployment();
  const simpleLuckySpinAddress = await simpleLuckySpin.getAddress();
  console.log("✅ SimpleFHELuckySpin deployed to:", simpleLuckySpinAddress);
  deploymentInfo.contracts.SimpleFHELuckySpin = simpleLuckySpinAddress;

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const prizeCount = await simpleLuckySpin.getPrizeCount();
  const contractBalance = await simpleLuckySpin.getContractBalance();
  console.log("  → Prize count:", prizeCount.toString());
  console.log("  → Contract balance:", hre.ethers.formatEther(contractBalance), "ETH");

  // Save deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `simple-${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📄 Deployment info saved to:", deploymentFile);

  // Update frontend .env
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

  envContent = updateEnvVar(envContent, "VITE_SIMPLE_FHE_LUCKY_SPIN_ADDRESS", simpleLuckySpinAddress);
  envContent = updateEnvVar(envContent, "VITE_SEPOLIA_CHAIN_ID", "11155111");
  envContent = updateEnvVar(envContent, "VITE_SEPOLIA_RPC_URL", process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com");

  fs.writeFileSync(frontendEnvPath, envContent.trim() + "\n");
  console.log("📝 Frontend .env updated with contract address");

  // Summary
  console.log("\n========================================");
  console.log("✅ DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("========================================");
  console.log("\nContract Address:");
  console.log("  SimpleFHELuckySpin: ", simpleLuckySpinAddress);

  console.log("\n📋 Next Steps:");
  console.log("  1. Verify contract on Etherscan (optional):");
  console.log("     npx hardhat verify --network sepolia", simpleLuckySpinAddress);
  console.log("\n  2. Fund the contract with ETH for prizes if needed");
  console.log("\n  3. Update frontend to use the new simplified contract");
  console.log("\n  4. Test the simplified application on Sepolia testnet");
  console.log("\n========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
