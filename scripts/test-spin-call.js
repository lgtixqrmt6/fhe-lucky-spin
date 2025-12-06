const hre = require("hardhat");

async function main() {
  console.log("Testing spin call with mock encrypted data...\n");

  const fheLuckySpinAddress = "0x7fe8D79646dF497D82B6703e6CF6Dac9183794e0";
  const fheLuckySpin = await hre.ethers.getContractAt("FHELuckySpinV2", fheLuckySpinAddress);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  // Get spin cost
  const spinManagerAddr = await fheLuckySpin.spinManager();
  const spinManager = await hre.ethers.getContractAt("SpinManager", spinManagerAddr);
  const spinCost = await spinManager.getSpinCost();
  console.log("Spin cost:", hre.ethers.formatEther(spinCost), "ETH");

  // Check if we can spin
  const userRecordsAddr = await fheLuckySpin.userRecords();
  const userRecords = await hre.ethers.getContractAt("UserRecords", userRecordsAddr);
  const canSpin = await userRecords.checkDailyLimit(deployer.address);
  console.log("Can spin:", canSpin);

  if (!canSpin) {
    console.log("❌ Daily limit exceeded");
    return;
  }

  // Check PrizeManager
  const prizeManagerAddr = await spinManager.prizeManager();
  console.log("PrizeManager address:", prizeManagerAddr);

  if (prizeManagerAddr === hre.ethers.ZeroAddress) {
    console.log("❌ PrizeManager not set in SpinManager!");
    return;
  }

  const prizeManager = await hre.ethers.getContractAt("PrizeManager", prizeManagerAddr);
  const prizeCount = await prizeManager.getPrizeCount();
  console.log("Prize count:", prizeCount.toString());

  if (prizeCount === 0n) {
    console.log("❌ No prizes configured!");
    return;
  }

  console.log("\n✅ All checks passed!");
  console.log("\nNote: Actual spin requires real FHE encrypted data from the frontend.");
  console.log("The error is likely in the FHE encryption parameters or handle format.");
  console.log("\nPlease check browser console for:");
  console.log("  1. Handle length (should be 66 chars: 0x + 64 hex)");
  console.log("  2. Proof format");
  console.log("  3. Any FHE SDK errors");
}

main().catch(console.error);
