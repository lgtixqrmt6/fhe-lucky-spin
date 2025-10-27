const hre = require("hardhat");

async function main() {
  const contractAddress = "0x7fe8D79646dF497D82B6703e6CF6Dac9183794e0";

  console.log("Checking contract status...");
  console.log("Contract address:", contractAddress);

  const FHELuckySpinV2 = await hre.ethers.getContractAt("FHELuckySpinV2", contractAddress);

  // Check basic contract state
  const owner = await FHELuckySpinV2.owner();
  console.log("Owner:", owner);

  const spinCost = await FHELuckySpinV2.SPIN_COST();
  console.log("Spin cost:", hre.ethers.formatEther(spinCost), "ETH");

  const maxSpinsPerDay = await FHELuckySpinV2.MAX_SPINS_PER_DAY();
  console.log("Max spins per day:", maxSpinsPerDay.toString());

  const balance = await hre.ethers.provider.getBalance(contractAddress);
  console.log("Contract balance:", hre.ethers.formatEther(balance), "ETH");

  // Check if prizes are set up
  console.log("\nChecking prize configuration...");
  for (let i = 0; i < 6; i++) {
    try {
      const prize = await FHELuckySpinV2.prizes(i);
      console.log(`Prize ${i}:`, prize.toString());
    } catch (e) {
      console.log(`Prize ${i}: Not set`);
    }
  }

  // Test if we can read the current day
  try {
    const currentDay = await FHELuckySpinV2.getCurrentDay();
    console.log("\nCurrent day:", currentDay.toString());
  } catch (e) {
    console.log("\nError getting current day:", e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
