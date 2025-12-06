const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrizeManager - Prize Configuration Tests", function () {
  let prizeManager;
  let owner, user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("PrizeManager");
    prizeManager = await Factory.deploy();
    await prizeManager.waitForDeployment();
  });

  it("should deploy PrizeManager successfully", async function () {
    expect(await prizeManager.getAddress()).to.be.properAddress;
    console.log("✅ PrizeManager deployed at:", await prizeManager.getAddress());
  });

  it("should have correct owner", async function () {
    const contractOwner = await prizeManager.owner();
    expect(contractOwner).to.equal(owner.address);
    console.log("✅ Owner is correct");
  });

  it("should have default prizes initialized", async function () {
    const prizeCount = await prizeManager.getPrizeCount();
    expect(prizeCount).to.be.greaterThan(0);
    console.log("✅ Default prizes initialized, count:", prizeCount.toString());
  });

  it("should get prize info correctly", async function () {
    const prize = await prizeManager.getPrize(0);

    expect(prize.name).to.not.be.empty;
    expect(prize.active).to.equal(true);
    console.log("✅ Prize 0:", prize.name, "- Value:", ethers.formatEther(prize.value), "ETH");
  });

  it("should get all prizes", async function () {
    const prizeCount = await prizeManager.getPrizeCount();

    for (let i = 0; i < prizeCount; i++) {
      const prize = await prizeManager.getPrize(i);
      expect(prize.name).to.not.be.empty;
      console.log(`  Prize ${i}: ${prize.name} - ${ethers.formatEther(prize.value)} ETH (${prize.probability}%)`);
    }

    console.log("✅ All prizes retrieved successfully");
  });

  it("should calculate total probability correctly", async function () {
    const prizeCount = await prizeManager.getPrizeCount();
    let totalProbability = 0;

    for (let i = 0; i < prizeCount; i++) {
      const prize = await prizeManager.getPrize(i);
      totalProbability += Number(prize.probability);
    }

    expect(totalProbability).to.equal(100);
    console.log("✅ Total probability equals 100%");
  });

  it("should add new prize", async function () {
    const initialCount = await prizeManager.getPrizeCount();

    await prizeManager.connect(owner).addPrize(
      "Super Jackpot",
      ethers.parseEther("1.0"),
      1, // PrizeType.ETH
      5  // 5% probability
    );

    const newCount = await prizeManager.getPrizeCount();
    expect(newCount).to.equal(initialCount + 1n);

    const newPrize = await prizeManager.getPrize(newCount - 1n);
    expect(newPrize.name).to.equal("Super Jackpot");
    console.log("✅ New prize added successfully");
  });

  it("should prevent non-owner from adding prizes", async function () {
    await expect(
      prizeManager.connect(user1).addPrize(
        "Fake Prize",
        ethers.parseEther("100"),
        1,
        50
      )
    ).to.be.revertedWithCustomError(prizeManager, "OwnableUnauthorizedAccount");
    console.log("✅ Non-owner cannot add prizes");
  });

  it("should update prize", async function () {
    const prizeId = 0;
    const newName = "Updated Prize";
    const newValue = ethers.parseEther("0.5");

    await prizeManager.connect(owner).updatePrize(
      prizeId,
      newName,
      newValue,
      1,
      10
    );

    const updatedPrize = await prizeManager.getPrize(prizeId);
    expect(updatedPrize.name).to.equal(newName);
    expect(updatedPrize.value).to.equal(newValue);
    console.log("✅ Prize updated successfully");
  });

  it("should toggle prize active status", async function () {
    const prizeId = 0;
    const prizeBefore = await prizeManager.getPrize(prizeId);
    const initialStatus = prizeBefore.active;

    await prizeManager.connect(owner).setPrizeActive(prizeId, !initialStatus);

    const prizeAfter = await prizeManager.getPrize(prizeId);
    expect(prizeAfter.active).to.equal(!initialStatus);
    console.log("✅ Prize active status toggled");
  });

  it("should emit PrizeAdded event", async function () {
    const tx = await prizeManager.connect(owner).addPrize(
      "Event Test Prize",
      ethers.parseEther("0.1"),
      0, // PrizeType.POINTS
      5
    );
    const receipt = await tx.wait();

    const event = receipt.logs.find(log => {
      try {
        const decoded = prizeManager.interface.parseLog(log);
        return decoded.name === 'PrizeAdded';
      } catch {
        return false;
      }
    });

    expect(event).to.not.be.undefined;
    console.log("✅ PrizeAdded event emitted");
  });

  it("should emit PrizeUpdated event", async function () {
    const tx = await prizeManager.connect(owner).updatePrize(
      0,
      "Updated Name",
      ethers.parseEther("0.2"),
      1,
      15
    );
    const receipt = await tx.wait();

    const event = receipt.logs.find(log => {
      try {
        const decoded = prizeManager.interface.parseLog(log);
        return decoded.name === 'PrizeUpdated';
      } catch {
        return false;
      }
    });

    expect(event).to.not.be.undefined;
    console.log("✅ PrizeUpdated event emitted");
  });

  it("should handle invalid prize ID gracefully", async function () {
    const invalidId = 999;

    await expect(
      prizeManager.getPrize(invalidId)
    ).to.be.reverted;
    console.log("✅ Invalid prize ID handled correctly");
  });

  it("should handle edge case: zero value prize", async function () {
    await prizeManager.connect(owner).addPrize(
      "No Prize",
      0,
      0,
      30
    );

    const prizeCount = await prizeManager.getPrizeCount();
    const zeroPrize = await prizeManager.getPrize(prizeCount - 1n);

    expect(zeroPrize.value).to.equal(0);
    console.log("✅ Zero value prize handled correctly");
  });

  it("should handle edge case: high value prize", async function () {
    const highValue = ethers.parseEther("100");

    await prizeManager.connect(owner).addPrize(
      "Mega Jackpot",
      highValue,
      1,
      1
    );

    const prizeCount = await prizeManager.getPrizeCount();
    const highPrize = await prizeManager.getPrize(prizeCount - 1n);

    expect(highPrize.value).to.equal(highValue);
    console.log("✅ High value prize handled correctly");
  });

  it("should handle performance: rapid prize additions", async function () {
    const startTime = Date.now();

    for (let i = 0; i < 10; i++) {
      await prizeManager.connect(owner).addPrize(
        `Prize ${i}`,
        ethers.parseEther("0.01"),
        i % 2,
        1
      );
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).to.be.lessThan(30000);
    console.log(`✅ 10 prize additions completed in ${duration}ms`);
  });
});
