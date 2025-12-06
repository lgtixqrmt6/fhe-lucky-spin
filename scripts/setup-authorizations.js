const hre = require("hardhat");

async function main() {
  console.log("Setting up contract authorizations...\n");

  // Deployed addresses
  const prizeManagerAddress = "0xDaE0bC40899B0b9ddf09f80aCe5B1e6cc7856627";
  const spinManagerAddress = "0xA3FbB1676e824c594d9aD313EED7C110AfE87517";
  const userRecordsAddress = "0x763c4feF42D9B469D394772e0DbD3C40337dd07F";
  const rewardDistributorAddress = "0x95BdAddCF78e54B2D5d49a1d53c8749087916414";
  const fheLuckySpinAddress = "0x7fe8D79646dF497D82B6703e6CF6Dac9183794e0";

  // Get contract instances
  const prizeManager = await hre.ethers.getContractAt("PrizeManager", prizeManagerAddress);
  const spinManager = await hre.ethers.getContractAt("SpinManager", spinManagerAddress);
  const userRecords = await hre.ethers.getContractAt("UserRecords", userRecordsAddress);
  const rewardDistributor = await hre.ethers.getContractAt("RewardDistributor", rewardDistributorAddress);

  // Step 1: Authorize FHELuckySpinV2 in PrizeManager
  console.log("1. Authorizing FHELuckySpinV2 in PrizeManager...");
  let tx = await prizeManager.setAuthorization(fheLuckySpinAddress, true);
  await tx.wait();
  console.log("✅ Done");

  // Wait a bit to avoid nonce issues
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 2: Set PrizeManager in SpinManager
  console.log("\n2. Setting PrizeManager in SpinManager...");
  tx = await spinManager.setPrizeManager(prizeManagerAddress);
  await tx.wait();
  console.log("✅ Done");

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3: Authorize FHELuckySpinV2 in SpinManager
  console.log("\n3. Authorizing FHELuckySpinV2 in SpinManager...");
  tx = await spinManager.setAuthorization(fheLuckySpinAddress, true);
  await tx.wait();
  console.log("✅ Done");

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 4: Authorize FHELuckySpinV2 in UserRecords
  console.log("\n4. Authorizing FHELuckySpinV2 in UserRecords...");
  tx = await userRecords.setAuthorization(fheLuckySpinAddress, true);
  await tx.wait();
  console.log("✅ Done");

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 5: Authorize FHELuckySpinV2 in RewardDistributor
  console.log("\n5. Authorizing FHELuckySpinV2 in RewardDistributor...");
  tx = await rewardDistributor.setAuthorization(fheLuckySpinAddress, true);
  await tx.wait();
  console.log("✅ Done");

  console.log("\n✅ All authorizations set up successfully!");
  console.log("\nContract Addresses:");
  console.log("  PrizeManager:       ", prizeManagerAddress);
  console.log("  SpinManager:        ", spinManagerAddress);
  console.log("  UserRecords:        ", userRecordsAddress);
  console.log("  RewardDistributor:  ", rewardDistributorAddress);
  console.log("  FHELuckySpinV2:     ", fheLuckySpinAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Setup failed:");
    console.error(error);
    process.exit(1);
  });
