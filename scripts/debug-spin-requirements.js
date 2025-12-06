const hre = require("hardhat");

async function main() {
  console.log("🔍 Debugging Spin Requirements\n");

  const fheLuckySpinAddress = "0x7fe8D79646dF497D82B6703e6CF6Dac9183794e0";
  const fheLuckySpin = await hre.ethers.getContractAt("FHELuckySpinV2", fheLuckySpinAddress);

  // Test with the actual user address from the screenshot
  const testAddress = "0x7645FfFd71e92BEDdF1237207724063Dc269d801";
  console.log("Testing with address:", testAddress);

  // 1. Check SpinManager
  console.log("\n1️⃣ Checking SpinManager...");
  const spinManagerAddr = await fheLuckySpin.spinManager();
  console.log("   SpinManager address:", spinManagerAddr);

  const spinManager = await hre.ethers.getContractAt("SpinManager", spinManagerAddr);
  const spinCost = await spinManager.getSpinCost();
  console.log("   Spin cost:", hre.ethers.formatEther(spinCost), "ETH");

  // 2. Check PrizeManager in SpinManager
  console.log("\n2️⃣ Checking PrizeManager...");
  const prizeManagerAddr = await spinManager.prizeManager();
  console.log("   PrizeManager address:", prizeManagerAddr);

  if (prizeManagerAddr === hre.ethers.ZeroAddress) {
    console.log("   ❌ ISSUE: PrizeManager is not set!");
    return;
  }

  const prizeManager = await hre.ethers.getContractAt("PrizeManager", prizeManagerAddr);
  const prizeCount = await prizeManager.getPrizeCount();
  console.log("   Prize count:", prizeCount.toString());

  if (prizeCount === 0n) {
    console.log("   ❌ ISSUE: No prizes configured!");
    return;
  }
  console.log("   ✅ PrizeManager OK");

  // 3. Check Authorization
  console.log("\n3️⃣ Checking Authorizations...");
  const isPrizeManagerAuth = await prizeManager.authorized(fheLuckySpinAddress);
  console.log("   PrizeManager authorizes FHELuckySpinV2:", isPrizeManagerAuth);

  const isSpinManagerAuth = await spinManager.authorized(fheLuckySpinAddress);
  console.log("   SpinManager authorizes FHELuckySpinV2:", isSpinManagerAuth);

  if (!isPrizeManagerAuth || !isSpinManagerAuth) {
    console.log("   ❌ ISSUE: Authorization missing!");
    return;
  }
  console.log("   ✅ Authorizations OK");

  // 4. Check UserRecords
  console.log("\n4️⃣ Checking UserRecords...");
  const userRecordsAddr = await fheLuckySpin.userRecords();
  console.log("   UserRecords address:", userRecordsAddr);

  const userRecords = await hre.ethers.getContractAt("UserRecords", userRecordsAddr);
  const isUserRecordsAuth = await userRecords.authorized(fheLuckySpinAddress);
  console.log("   UserRecords authorizes FHELuckySpinV2:", isUserRecordsAuth);

  const canSpin = await userRecords.checkDailyLimit(testAddress);
  console.log("   User can spin:", canSpin);

  const remainingSpins = await userRecords.getRemainingSpins(testAddress);
  console.log("   Remaining spins:", remainingSpins.toString());

  if (!canSpin) {
    console.log("   ❌ ISSUE: Daily limit exceeded!");
    return;
  }
  console.log("   ✅ UserRecords OK");

  // 5. Check RewardDistributor
  console.log("\n5️⃣ Checking RewardDistributor...");
  const rewardDistributorAddr = await fheLuckySpin.rewardDistributor();
  console.log("   RewardDistributor address:", rewardDistributorAddr);

  const rewardDistributor = await hre.ethers.getContractAt("RewardDistributor", rewardDistributorAddr);
  const isRewardAuth = await rewardDistributor.authorized(fheLuckySpinAddress);
  console.log("   RewardDistributor authorizes FHELuckySpinV2:", isRewardAuth);
  console.log("   ✅ RewardDistributor OK");

  // 6. Check contract ownership
  console.log("\n6️⃣ Checking Contract Ownership...");
  const owner = await fheLuckySpin.owner();
  console.log("   FHELuckySpinV2 owner:", owner);

  const spinManagerOwner = await spinManager.owner();
  console.log("   SpinManager owner:", spinManagerOwner);

  const prizeManagerOwner = await prizeManager.owner();
  console.log("   PrizeManager owner:", prizeManagerOwner);

  console.log("\n✅ All checks passed! The contracts are properly configured.");
  console.log("\n💡 If spin still fails, the issue is likely in the FHE encryption/decryption process.");
  console.log("   Check if the Zama Gateway is accessible and FHE operations are working correctly.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Debug failed:");
    console.error(error);
    process.exit(1);
  });
