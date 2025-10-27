const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FHELuckySpinV2 Contract Tests", function () {
  let fheLuckySpin;
  let owner;
  let player1;
  let player2;

  const SPIN_COST = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    // Deploy contract
    const FHELuckySpinV2 = await ethers.getContractFactory("FHELuckySpinV2");
    fheLuckySpin = await FHELuckySpinV2.deploy();
    await fheLuckySpin.waitForDeployment();

    console.log("Contract deployed to:", await fheLuckySpin.getAddress());
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await fheLuckySpin.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct prize configuration", async function () {
      const prizeCount = await fheLuckySpin.getPrizeCount();
      expect(prizeCount).to.equal(5);
    });

    it("Should set correct daily spin limit", async function () {
      const remainingSpins = await fheLuckySpin.getRemainingSpins(player1.address);
      expect(remainingSpins).to.equal(10);
    });
  });

  describe("Spin Functionality", function () {
    it("Should fail when insufficient payment", async function () {
      const mockHandle = ethers.ZeroHash;
      const mockProof = "0x";

      await expect(
        fheLuckySpin.connect(player1).spin(mockHandle, mockProof, {
          value: ethers.parseEther("0.005")
        })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should fail when daily limit exceeded", async function () {
      const mockHandle = ethers.ZeroHash;
      const mockProof = "0x";

      // Perform 10 spins to reach limit
      for (let i = 0; i < 10; i++) {
        await fheLuckySpin.connect(player1).spin(mockHandle, mockProof, {
          value: SPIN_COST
        });
      }

      // 11th spin should fail
      await expect(
        fheLuckySpin.connect(player1).spin(mockHandle, mockProof, {
          value: SPIN_COST
        })
      ).to.be.revertedWith("Daily spin limit reached");
    });

    it("Should track spin count correctly", async function () {
      const mockHandle = ethers.ZeroHash;
      const mockProof = "0x";

      await fheLuckySpin.connect(player1).spin(mockHandle, mockProof, {
        value: SPIN_COST
      });

      const spinCount = await fheLuckySpin.getUserSpinCount(player1.address);
      expect(spinCount).to.equal(1);
    });

    it("Should emit SpinRecorded event", async function () {
      const mockHandle = ethers.ZeroHash;
      const mockProof = "0x";

      await expect(
        fheLuckySpin.connect(player1).spin(mockHandle, mockProof, {
          value: SPIN_COST
        })
      ).to.emit(fheLuckySpin, "SpinRecorded");
    });
  });

  describe("Prize Management", function () {
    it("Should return correct prize information", async function () {
      const prize0 = await fheLuckySpin.getPrizeInfo(0);
      expect(prize0.name).to.equal("Thank You");
      expect(prize0.points).to.equal(0);
      expect(prize0.probability).to.equal(40);

      const prize4 = await fheLuckySpin.getPrizeInfo(4);
      expect(prize4.name).to.equal("5000 Points");
      expect(prize4.points).to.equal(5000);
      expect(prize4.probability).to.equal(2);
    });

    it("Should track user points correctly", async function () {
      const initialPoints = await fheLuckySpin.getUserPoints(player1.address);
      expect(initialPoints).to.equal(0);
    });
  });

  describe("Access Control", function () {
    it("Should allow only owner to withdraw", async function () {
      // Add some balance to contract
      await fheLuckySpin.connect(player1).spin(ethers.ZeroHash, "0x", {
        value: SPIN_COST
      });

      await expect(
        fheLuckySpin.connect(player1).withdraw(owner.address, SPIN_COST)
      ).to.be.revertedWithCustomError(fheLuckySpin, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to withdraw", async function () {
      // Add some balance to contract
      await fheLuckySpin.connect(player1).spin(ethers.ZeroHash, "0x", {
        value: SPIN_COST
      });

      const balanceBefore = await ethers.provider.getBalance(owner.address);

      await fheLuckySpin.connect(owner).withdraw(owner.address, SPIN_COST);

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });

  describe("Daily Reset", function () {
    it("Should reset spins after 24 hours", async function () {
      const mockHandle = ethers.ZeroHash;
      const mockProof = "0x";

      // Perform 10 spins
      for (let i = 0; i < 10; i++) {
        await fheLuckySpin.connect(player1).spin(mockHandle, mockProof, {
          value: SPIN_COST
        });
      }

      let remaining = await fheLuckySpin.getRemainingSpins(player1.address);
      expect(remaining).to.equal(0);

      // Fast forward 24 hours
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      remaining = await fheLuckySpin.getRemainingSpins(player1.address);
      expect(remaining).to.equal(10);
    });
  });

  describe("Contract Balance", function () {
    it("Should track contract balance correctly", async function () {
      const initialBalance = await fheLuckySpin.getContractBalance();
      expect(initialBalance).to.equal(0);

      await fheLuckySpin.connect(player1).spin(ethers.ZeroHash, "0x", {
        value: SPIN_COST
      });

      const newBalance = await fheLuckySpin.getContractBalance();
      expect(newBalance).to.equal(SPIN_COST);
    });
  });

  describe("Multiple Users", function () {
    it("Should track spins independently for different users", async function () {
      const mockHandle = ethers.ZeroHash;
      const mockProof = "0x";

      // Player 1 spins 3 times
      for (let i = 0; i < 3; i++) {
        await fheLuckySpin.connect(player1).spin(mockHandle, mockProof, {
          value: SPIN_COST
        });
      }

      // Player 2 spins 5 times
      for (let i = 0; i < 5; i++) {
        await fheLuckySpin.connect(player2).spin(mockHandle, mockProof, {
          value: SPIN_COST
        });
      }

      const player1Spins = await fheLuckySpin.getUserSpinCount(player1.address);
      const player2Spins = await fheLuckySpin.getUserSpinCount(player2.address);

      expect(player1Spins).to.equal(3);
      expect(player2Spins).to.equal(5);

      const player1Remaining = await fheLuckySpin.getRemainingSpins(player1.address);
      const player2Remaining = await fheLuckySpin.getRemainingSpins(player2.address);

      expect(player1Remaining).to.equal(7);
      expect(player2Remaining).to.equal(5);
    });
  });
});
