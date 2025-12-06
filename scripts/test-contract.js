const { ethers } = require("hardhat");

async function main() {
  console.log("Starting FHE Lucky Spin contract testing...");
  
  // Get contract instance
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("Please set CONTRACT_ADDRESS environment variable");
  }
  
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const user1 = signers[1] || signers[0]; // Use deployer if only one signer
  const luckySpin = await ethers.getContractAt("FHELuckySpinV2", contractAddress);
  
  console.log("Contract address:", contractAddress);
  console.log("Test account:", user1.address);
  
  // Test 1: Get prize information
  console.log("\n=== Test 1: Get Prize Information ===");
  const prizeCount = await luckySpin.getPrizeCount();
  console.log("Prize count:", prizeCount.toString());
  
  for (let i = 0; i < Number(prizeCount); i++) {
    const prize = await luckySpin.getPrize(i);
    console.log(`Prize ${i}: ${prize.name}, Value: ${ethers.formatEther(prize.value)} ETH, Probability: ${prize.probability}%`);
  }
  
  // Test 2: Get user statistics
  console.log("\n=== Test 2: Get User Statistics ===");
  const userSpinCount = await luckySpin.getUserSpinCount(user1.address);
  const remainingSpins = await luckySpin.getRemainingSpins(user1.address);
  console.log("User spin count:", userSpinCount.toString());
  console.log("Remaining spins:", remainingSpins.toString());
  
  // Test 3: Get contract information
  console.log("\n=== Test 3: Get Contract Information ===");
  const contractBalance = await luckySpin.getContractBalance();
  const globalStats = await luckySpin.getGlobalStats();
  console.log("Contract balance:", ethers.formatEther(contractBalance), "ETH");
  console.log("Spin cost:", ethers.formatEther(globalStats[3]), "ETH");
  console.log("Total points distributed:", globalStats[0].toString());
  console.log("Total ETH distributed:", ethers.formatEther(globalStats[1]), "ETH");
  
  // Test 4: Check network
  console.log("\n=== Test 4: Check Network ===");
  const network = await ethers.provider.getNetwork();
  console.log("Current network:", network.name, "Chain ID:", network.chainId.toString());
  
  if (Number(network.chainId) !== 11155111) {
    console.log("⚠️  Warning: Not on Sepolia network, FHE functionality may not work properly");
  } else {
    console.log("✅ Network correct: Sepolia");
  }
  
  console.log("\n=== Testing Completed ===");
  console.log("Contract basic functionality is working!");
  console.log("Note: FHE spin functionality needs to be tested on Sepolia network");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Testing failed:", error);
    process.exit(1);
  });
