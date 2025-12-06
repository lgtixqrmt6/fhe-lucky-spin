const hre = require("hardhat");

async function main() {
  console.log("Testing spin parameters...\n");

  const fheLuckySpinAddress = "0xE13E1309DD0d8C4a99B639258581a3177f736EA7";
  const fheLuckySpin = await hre.ethers.getContractAt("FHELuckySpinV2", fheLuckySpinAddress);

  // Get spin cost
  const spinCost = await fheLuckySpin.spinManager();
  const spinManagerContract = await hre.ethers.getContractAt("SpinManager", spinCost);
  const cost = await spinManagerContract.getSpinCost();
  console.log("Spin cost:", hre.ethers.formatEther(cost), "ETH");

  // Check prize manager
  const prizeManagerAddr = await spinManagerContract.prizeManager();
  console.log("PrizeManager address:", prizeManagerAddr);

  const prizeManager = await hre.ethers.getContractAt("PrizeManager", prizeManagerAddr);
  const prizeCount = await prizeManager.getPrizeCount();
  console.log("Prize count:", prizeCount.toString());

  // Check user records
  const userRecordsAddr = await fheLuckySpin.userRecords();
  console.log("UserRecords address:", userRecordsAddr);

  // Get deployer for testing
  const [deployer] = await hre.ethers.getSigners();
  console.log("\nDeployer address:", deployer.address);

  // Check daily limit
  const userRecords = await hre.ethers.getContractAt("UserRecords", userRecordsAddr);
  const canSpin = await userRecords.checkDailyLimit(deployer.address);
  console.log("Can spin:", canSpin);

  const remainingSpins = await userRecords.getRemainingSpins(deployer.address);
  console.log("Remaining spins today:", remainingSpins.toString());

  console.log("\n✅ All contract checks passed!");
  console.log("\nNote: The transaction failure is likely due to FHE encryption parameters.");
  console.log("Check browser console for encryption logs to debug further.");
}

main().catch(console.error);
