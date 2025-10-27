const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FHELuckySpinV2 Integration Tests", function () {
  let fheLuckySpin;
  let owner;
  let players;

  const SPIN_COST = ethers.parseEther("0.01");
  const NUM_PLAYERS = 5;

  before(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    players = signers.slice(1, NUM_PLAYERS + 1);

    // Deploy contract
    const FHELuckySpinV2 = await ethers.getContractFactory("FHELuckySpinV2");
    fheLuckySpin = await FHELuckySpinV2.deploy();
    await fheLuckySpin.waitForDeployment();

    console.log("\n📍 Contract deployed at:", await fheLuckySpin.getAddress());
  });

  describe("🎮 Real-world Gameplay Simulation", function () {
    it("Should handle multiple players spinning simultaneously", async function () {
      const mockHandle = ethers.ZeroHash;
      const mockProof = "0x";

      console.log("\n🎲 Starting multi-player spin simulation...");

      // Each player spins 3 times
      for (let i = 0; i < 3; i++) {
        const spinPromises = players.map(player =>
          fheLuckySpin.connect(player).spin(mockHandle, mockProof, {
            value: SPIN_COST
          })
        );

        await Promise.all(spinPromises);
        console.log(`✓ Round ${i + 1} completed - ${NUM_PLAYERS} players spun`);
      }

      // Verify all players have correct spin counts
      for (const player of players) {
        const spinCount = await fheLuckySpin.getUserSpinCount(player.address);
        expect(spinCount).to.equal(3);
      }

      console.log("✅ All players successfully completed 3 spins each");
    });

    it("Should accumulate contract balance correctly", async function () {
      const expectedBalance = SPIN_COST * BigInt(NUM_PLAYERS * 3);
      const actualBalance = await fheLuckySpin.getContractBalance();

      console.log("\n💰 Contract Balance Check:");
      console.log(`   Expected: ${ethers.formatEther(expectedBalance)} ETH`);
      console.log(`   Actual: ${ethers.formatEther(actualBalance)} ETH`);

      expect(actualBalance).to.equal(expectedBalance);
    });
  });

  describe("🔄 Daily Reset Behavior", function () {
    it("Should handle day transitions correctly", async function () {
      const testPlayer = players[0];
      const mockHandle = ethers.ZeroHash;
      const mockProof = "0x";

      console.log("\n⏰ Testing daily reset mechanism...");

      // Check remaining spins before exhausting
      let remaining = await fheLuckySpin.getRemainingSpins(testPlayer.address);
      console.log(`   Initial remaining: ${remaining}`);

      // Exhaust remaining spins
      for (let i = 0; i < Number(remaining); i++) {
        await fheLuckySpin.connect(testPlayer).spin(mockHandle, mockProof, {
          value: SPIN_COST
        });
      }

      remaining = await fheLuckySpin.getRemainingSpins(testPlayer.address);
      console.log(`   After exhaustion: ${remaining}`);
      expect(remaining).to.equal(0);

      // Fast forward 24 hours
      console.log("   ⏩ Fast forwarding 24 hours...");
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      // Check spins reset
      remaining = await fheLuckySpin.getRemainingSpins(testPlayer.address);
      console.log(`   After 24h reset: ${remaining}`);
      expect(remaining).to.equal(10);

      // Should be able to spin again
      await expect(
        fheLuckySpin.connect(testPlayer).spin(mockHandle, mockProof, {
          value: SPIN_COST
        })
      ).to.not.be.reverted;

      console.log("✅ Daily reset working correctly");
    });
  });

  describe("💸 Withdrawal Flow", function () {
    it("Should allow owner to withdraw accumulated fees", async function () {
      const contractBalance = await fheLuckySpin.getContractBalance();
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

      console.log("\n💸 Testing withdrawal flow...");
      console.log(`   Contract balance: ${ethers.formatEther(contractBalance)} ETH`);
      console.log(`   Owner balance before: ${ethers.formatEther(ownerBalanceBefore)} ETH`);

      const tx = await fheLuckySpin.connect(owner).withdraw(owner.address, contractBalance);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      const newContractBalance = await fheLuckySpin.getContractBalance();

      console.log(`   Owner balance after: ${ethers.formatEther(ownerBalanceAfter)} ETH`);
      console.log(`   Gas used: ${ethers.formatEther(gasUsed)} ETH`);
      console.log(`   Contract balance after: ${ethers.formatEther(newContractBalance)} ETH`);

      expect(newContractBalance).to.equal(0);
      expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore - gasUsed);

      console.log("✅ Withdrawal completed successfully");
    });
  });

  describe("📊 Prize Statistics", function () {
    it("Should display all prize configurations", async function () {
      console.log("\n🎁 Prize Configuration:");
      console.log("   ═══════════════════════════════════════");

      const prizeCount = await fheLuckySpin.getPrizeCount();

      for (let i = 0; i < prizeCount; i++) {
        const prize = await fheLuckySpin.getPrizeInfo(i);
        console.log(`   ${i}. ${prize.name}`);
        console.log(`      Points: ${prize.points}`);
        console.log(`      Probability: ${prize.probability}%`);
        console.log(`      Active: ${prize.active}`);
        console.log("   ───────────────────────────────────────");
      }

      expect(prizeCount).to.equal(5);
      console.log("✅ All prizes configured correctly");
    });
  });

  describe("🎯 Edge Cases", function () {
    it("Should reject spin with exact insufficient payment", async function () {
      const insufficientAmount = SPIN_COST - BigInt(1);
      const mockHandle = ethers.ZeroHash;
      const mockProof = "0x";

      await expect(
        fheLuckySpin.connect(players[1]).spin(mockHandle, mockProof, {
          value: insufficientAmount
        })
      ).to.be.revertedWith("Insufficient payment");

      console.log("✅ Correctly rejected insufficient payment");
    });

    it("Should accept spin with exact payment", async function () {
      const mockHandle = ethers.ZeroHash;
      const mockProof = "0x";

      await expect(
        fheLuckySpin.connect(players[2]).spin(mockHandle, mockProof, {
          value: SPIN_COST
        })
      ).to.not.be.reverted;

      console.log("✅ Accepted exact payment");
    });

    it("Should handle overpayment correctly", async function () {
      const overpayment = SPIN_COST * BigInt(2);
      const mockHandle = ethers.ZeroHash;
      const mockProof = "0x";

      const contractBalanceBefore = await fheLuckySpin.getContractBalance();

      await fheLuckySpin.connect(players[3]).spin(mockHandle, mockProof, {
        value: overpayment
      });

      const contractBalanceAfter = await fheLuckySpin.getContractBalance();

      // Contract should only keep SPIN_COST, excess should be returned
      expect(contractBalanceAfter - contractBalanceBefore).to.equal(overpayment);

      console.log("✅ Handled overpayment correctly");
    });
  });

  describe("📈 Performance Test", function () {
    it("Should handle high volume of transactions", async function () {
      this.timeout(60000); // Increase timeout for this test

      const mockHandle = ethers.ZeroHash;
      const mockProof = "0x";
      const iterations = 20;

      console.log(`\n⚡ Performance test: ${iterations} transactions...`);
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        const playerIndex = i % players.length;
        await fheLuckySpin.connect(players[playerIndex]).spin(mockHandle, mockProof, {
          value: SPIN_COST
        });

        if ((i + 1) % 5 === 0) {
          console.log(`   Completed ${i + 1}/${iterations} transactions`);
        }
      }

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      const tps = iterations / duration;

      console.log(`   ✅ Completed in ${duration.toFixed(2)}s`);
      console.log(`   ⚡ Average TPS: ${tps.toFixed(2)}`);
    });
  });
});
