const hre = require("hardhat");

async function main() {
  const prizeManager = await hre.ethers.getContractAt("PrizeManager", "0x01D6E3f0e60202552a5874300b4046230664C285");

  console.log("Checking PrizeManager configuration...\n");

  const count = await prizeManager.getPrizeCount();
  console.log("✅ Prize count:", count.toString());

  if (count > 0) {
    console.log("\nPrize Details:");
    for (let i = 0; i < count; i++) {
      const prize = await prizeManager.getPrize(i);
      console.log(`  Prize ${i}: ${prize.name} - ${prize.probability}% - Active: ${prize.active}`);
      console.log(`           Type: ${prize.prizeType}, Value: ${hre.ethers.formatEther(prize.value)} ETH`);
    }
  } else {
    console.log("❌ No prizes configured!");
  }

  const totalProb = await prizeManager.getTotalProbability();
  console.log("\n Total Probability:", totalProb.toString() + "%");
}

main().catch(console.error);
