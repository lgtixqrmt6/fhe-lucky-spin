const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RewardDistributor - Reward Distribution Tests", function () {
  let rewardDistributor;
  let owner, user1, user2, user3;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("RewardDistributor");
    rewardDistributor = await Factory.deploy();
    await rewardDistributor.waitForDeployment();

    // Fund the contract
    await owner.sendTransaction({
      to: await rewardDistributor.getAddress(),
      value: ethers.parseEther("10")
    });
  });

  it("should deploy RewardDistributor successfully", async function () {
    expect(await rewardDistributor.getAddress()).to.be.properAddress;
    console.log("✅ RewardDistributor deployed at:", await rewardDistributor.getAddress());
  });

  it("should have correct owner", async function () {
    const contractOwner = await rewardDistributor.owner();
    expect(contractOwner).to.equal(owner.address);
    console.log("✅ Owner is correct");
  });

  it("should receive ETH deposits", async function () {
    const depositAmount = ethers.parseEther("1");
    const balanceBefore = await ethers.provider.getBalance(await rewardDistributor.getAddress());

    await owner.sendTransaction({
      to: await rewardDistributor.getAddress(),
      value: depositAmount
    });

    const balanceAfter = await ethers.provider.getBalance(await rewardDistributor.getAddress());
    expect(balanceAfter).to.equal(balanceBefore + depositAmount);
    console.log("✅ ETH deposits work correctly");
  });

  it("should emit FundsDeposited event on receive", async function () {
    const depositAmount = ethers.parseEther("0.5");

    await expect(
      owner.sendTransaction({
        to: await rewardDistributor.getAddress(),
        value: depositAmount
      })
    ).to.emit(rewardDistributor, "FundsDeposited")
      .withArgs(owner.address, depositAmount);

    console.log("✅ FundsDeposited event emitted");
  });

  it("should distribute points reward", async function () {
    // Authorize owner as caller
    await rewardDistributor.connect(owner).setAuthorizedCaller(owner.address, true);

    const pointsAmount = 1000;
    await rewardDistributor.connect(owner).distributePoints(user1.address, pointsAmount);

    const userPoints = await rewardDistributor.getUserPoints(user1.address);
    expect(userPoints).to.equal(pointsAmount);
    console.log("✅ Points distribution works");
  });

  it("should distribute ETH reward", async function () {
    await rewardDistributor.connect(owner).setAuthorizedCaller(owner.address, true);

    const ethAmount = ethers.parseEther("0.1");
    const userBalanceBefore = await ethers.provider.getBalance(user1.address);

    await rewardDistributor.connect(owner).distributeETH(user1.address, ethAmount);

    const userBalanceAfter = await ethers.provider.getBalance(user1.address);
    expect(userBalanceAfter).to.equal(userBalanceBefore + ethAmount);
    console.log("✅ ETH distribution works");
  });

  it("should track total points distributed", async function () {
    await rewardDistributor.connect(owner).setAuthorizedCaller(owner.address, true);

    const amounts = [100, 200, 300];
    for (const amount of amounts) {
      await rewardDistributor.connect(owner).distributePoints(user1.address, amount);
    }

    const userPoints = await rewardDistributor.getUserPoints(user1.address);
    expect(userPoints).to.equal(600);
    console.log("✅ Points accumulation works");
  });

  it("should track total ETH distributed", async function () {
    await rewardDistributor.connect(owner).setAuthorizedCaller(owner.address, true);

    const amount = ethers.parseEther("0.5");
    await rewardDistributor.connect(owner).distributeETH(user1.address, amount);

    const totalEth = await rewardDistributor.getUserTotalETH(user1.address);
    expect(totalEth).to.equal(amount);
    console.log("✅ ETH tracking works");
  });

  it("should prevent unauthorized distribution", async function () {
    await expect(
      rewardDistributor.connect(user1).distributePoints(user2.address, 100)
    ).to.be.revertedWith("Not authorized");

    await expect(
      rewardDistributor.connect(user1).distributeETH(user2.address, ethers.parseEther("0.1"))
    ).to.be.revertedWith("Not authorized");

    console.log("✅ Unauthorized distribution prevented");
  });

  it("should authorize and revoke callers", async function () {
    // Authorize
    await rewardDistributor.connect(owner).setAuthorizedCaller(user1.address, true);
    let isAuthorized = await rewardDistributor.authorizedCallers(user1.address);
    expect(isAuthorized).to.equal(true);

    // Revoke
    await rewardDistributor.connect(owner).setAuthorizedCaller(user1.address, false);
    isAuthorized = await rewardDistributor.authorizedCallers(user1.address);
    expect(isAuthorized).to.equal(false);

    console.log("✅ Authorization management works");
  });

  it("should emit PointsDistributed event", async function () {
    await rewardDistributor.connect(owner).setAuthorizedCaller(owner.address, true);

    await expect(
      rewardDistributor.connect(owner).distributePoints(user1.address, 500)
    ).to.emit(rewardDistributor, "PointsDistributed")
      .withArgs(user1.address, 500);

    console.log("✅ PointsDistributed event emitted");
  });

  it("should emit ETHDistributed event", async function () {
    await rewardDistributor.connect(owner).setAuthorizedCaller(owner.address, true);

    const amount = ethers.parseEther("0.05");
    await expect(
      rewardDistributor.connect(owner).distributeETH(user1.address, amount)
    ).to.emit(rewardDistributor, "ETHDistributed")
      .withArgs(user1.address, amount);

    console.log("✅ ETHDistributed event emitted");
  });

  it("should handle multiple users", async function () {
    await rewardDistributor.connect(owner).setAuthorizedCaller(owner.address, true);

    const users = [user1, user2, user3];
    for (let i = 0; i < users.length; i++) {
      await rewardDistributor.connect(owner).distributePoints(users[i].address, (i + 1) * 100);
    }

    expect(await rewardDistributor.getUserPoints(user1.address)).to.equal(100);
    expect(await rewardDistributor.getUserPoints(user2.address)).to.equal(200);
    expect(await rewardDistributor.getUserPoints(user3.address)).to.equal(300);

    console.log("✅ Multiple users handled correctly");
  });

  it("should handle insufficient balance for ETH distribution", async function () {
    await rewardDistributor.connect(owner).setAuthorizedCaller(owner.address, true);

    const excessiveAmount = ethers.parseEther("1000"); // More than contract has

    await expect(
      rewardDistributor.connect(owner).distributeETH(user1.address, excessiveAmount)
    ).to.be.revertedWith("Insufficient balance");

    console.log("✅ Insufficient balance check works");
  });

  it("should allow owner to withdraw emergency funds", async function () {
    const contractBalance = await ethers.provider.getBalance(await rewardDistributor.getAddress());
    const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

    const tx = await rewardDistributor.connect(owner).emergencyWithdraw();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;

    const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
    expect(ownerBalanceAfter).to.be.greaterThan(ownerBalanceBefore - gasUsed);

    console.log("✅ Emergency withdrawal works");
  });

  it("should prevent non-owner from emergency withdrawal", async function () {
    await expect(
      rewardDistributor.connect(user1).emergencyWithdraw()
    ).to.be.revertedWithCustomError(rewardDistributor, "OwnableUnauthorizedAccount");

    console.log("✅ Non-owner emergency withdrawal prevented");
  });

  it("should handle edge case: zero points distribution", async function () {
    await rewardDistributor.connect(owner).setAuthorizedCaller(owner.address, true);

    await rewardDistributor.connect(owner).distributePoints(user1.address, 0);
    const userPoints = await rewardDistributor.getUserPoints(user1.address);
    expect(userPoints).to.equal(0);

    console.log("✅ Zero points distribution handled");
  });

  it("should handle rapid sequential distributions", async function () {
    await rewardDistributor.connect(owner).setAuthorizedCaller(owner.address, true);

    const startTime = Date.now();

    for (let i = 0; i < 20; i++) {
      await rewardDistributor.connect(owner).distributePoints(user1.address, 50);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    const totalPoints = await rewardDistributor.getUserPoints(user1.address);
    expect(totalPoints).to.equal(1000);
    expect(duration).to.be.lessThan(60000);

    console.log(`✅ 20 rapid distributions completed in ${duration}ms`);
  });
});
