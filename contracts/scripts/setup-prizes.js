const hre = require("hardhat");

async function main() {
  console.log("Setting up prizes for Lucky Spin...\n");

  // Deployed addresses
  const prizeManagerAddress = "0x01D6E3f0e60202552a5874300b4046230664C285";

  // Get contract instance
  const prizeManager = await hre.ethers.getContractAt("PrizeManager", prizeManagerAddress);

  // Define prizes (must add up to 100% = 100)
  const prizes = [
    {
      name: "Thank You",
      prizeType: 0, // Points
      value: 0,
      probability: 40,
      active: true
    },
    {
      name: "100 Points",
      prizeType: 0, // Points
      value: 100,
      probability: 30,
      active: true
    },
    {
      name: "500 Points",
      prizeType: 0, // Points
      value: 500,
      probability: 20,
      active: true
    },
    {
      name: "0.1 ETH",
      prizeType: 1, // ETH
      value: hre.ethers.parseEther("0.1"),
      probability: 8,
      active: true
    },
    {
      name: "0.5 ETH",
      prizeType: 1, // ETH
      value: hre.ethers.parseEther("0.5"),
      probability: 2,
      active: true
    }
  ];

  console.log("Adding prizes to PrizeManager...\n");

  for (let i = 0; i < prizes.length; i++) {
    const prize = prizes[i];
    console.log(`${i + 1}. Adding prize: ${prize.name} (${prize.probability}%)`);

    const tx = await prizeManager.addPrize(
      prize.name,
      prize.prizeType,
      prize.value,
      prize.probability,
      prize.active
    );
    await tx.wait();

    console.log(`   ✅ Prize added (tx: ${tx.hash})`);

    // Wait a bit to avoid nonce issues
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Verify prizes
  console.log("\n🔍 Verifying prizes...");
  const prizeCount = await prizeManager.getPrizeCount();
  console.log(`Total prizes: ${prizeCount}`);

  for (let i = 0; i < prizeCount; i++) {
    const prize = await prizeManager.getPrize(i);
    console.log(`  Prize ${i}: ${prize.name} - ${prize.probability}% - Active: ${prize.active}`);
  }

  console.log("\n✅ All prizes set up successfully!");
  console.log("\nPrize Distribution:");
  console.log("  Thank You:    40% (0 points)");
  console.log("  100 Points:   30%");
  console.log("  500 Points:   20%");
  console.log("  0.1 ETH:       8%");
  console.log("  0.5 ETH:       2%");
  console.log("  Total:       100%");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Setup failed:");
    console.error(error);
    process.exit(1);
  });
