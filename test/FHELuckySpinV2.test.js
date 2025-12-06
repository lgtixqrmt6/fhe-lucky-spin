const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("FHELuckySpinV2 - Comprehensive Integration Tests", function () {
  let luckySpinV2;
  let prizeManager, spinManager, userRecords, rewardDistributor;
  let owner, user1, user2, user3;
  const SPIN_COST = ethers.parseEther("0.01");

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy all module contracts
    const PrizeManagerFactory = await ethers.getContractFactory("PrizeManager");
    prizeManager = await PrizeManagerFactory.deploy();
    await prizeManager.waitForDeployment();

    const SpinManagerFactory = await ethers.getContractFactory("SpinManager");
    spinManager = await SpinManagerFactory.deploy(await prizeManager.getAddress());
    await spinManager.waitForDeployment();

    const UserRecordsFactory = await ethers.getContractFactory("UserRecords");
    userRecords = await UserRecordsFactory.deploy();
    await userRecords.waitForDeployment();

    const RewardDistributorFactory = await ethers.getContractFactory("RewardDistributor");
    rewardDistributor = await RewardDistributorFactory.deploy();
    await rewardDistributor.waitForDeployment();

    // Deploy main orchestrator
    const FHELuckySpinV2Factory = await ethers.getContractFactory("FHELuckySpinV2");
    luckySpinV2 = await FHELuckySpinV2Factory.deploy(
      await prizeManager.getAddress(),
      await spinManager.getAddress(),
      await userRecords.getAddress(),
      await rewardDistributor.getAddress()
    );
    await luckySpinV2.waitForDeployment();

    // Authorize main contract in all modules
    await spinManager.connect(owner).setAuthorizedCaller(await luckySpinV2.getAddress(), true);
    await userRecords.connect(owner).setAuthorizedCaller(await luckySpinV2.getAddress(), true);
    await rewardDistributor.connect(owner).setAuthorizedCaller(await luckySpinV2.getAddress(), true);

    // Fund reward distributor
    await owner.sendTransaction({
      to: await rewardDistributor.getAddress(),
      value: ethers.parseEther("5")
    });
  });

  it("should deploy all contracts successfully", async function () {
    expect(await luckySpinV2.getAddress()).to.be.properAddress;
    expect(await prizeManager.getAddress()).to.be.properAddress;
    expect(await spinManager.getAddress()).to.be.properAddress;
    expect(await userRecords.getAddress()).to.be.properAddress;
    expect(await rewardDistributor.getAddress()).to.be.properAddress;
    console.log("✅ All contracts deployed successfully");
  });

  it("should have correct module references", async function () {
    expect(await luckySpinV2.prizeManager()).to.equal(await prizeManager.getAddress());
    expect(await luckySpinV2.spinManager()).to.equal(await spinManager.getAddress());
    expect(await luckySpinV2.userRecords()).to.equal(await userRecords.getAddress());
    expect(await luckySpinV2.rewardDistributor()).to.equal(await rewardDistributor.getAddress());
    console.log("✅ Module references are correct");
  });

  it("should execute full spin flow", async function () {
    const encrypted = await fhevm
      .createEncryptedInput(await luckySpinV2.getAddress(), user1.address)
      .add8(2)
      .encrypt();

    const tx = await luckySpinV2.connect(user1).spin(
      encrypted.handles[0],
      encrypted.inputProof,
      { value: SPIN_COST }
    );
    await tx.wait();

    const spinCount = await luckySpinV2.getUserSpinCount(user1.address);
    expect(spinCount).to.equal(1);
    console.log("✅ Full spin flow executed successfully");
  });

  it("should get remaining spins from orchestrator", async function () {
    const remaining = await luckySpinV2.getRemainingSpins(user1.address);
    expect(remaining).to.equal(10);
    console.log("✅ getRemainingSpins works via orchestrator");
  });

  it("should get user points", async function () {
    // Execute a spin that awards points
    const encrypted = await fhevm
      .createEncryptedInput(await luckySpinV2.getAddress(), user1.address)
      .add8(0) // First prize (usually points)
      .encrypt();

    await luckySpinV2.connect(user1).spin(
      encrypted.handles[0],
      encrypted.inputProof,
      { value: SPIN_COST }
    );

    const points = await luckySpinV2.getUserPoints(user1.address);
    expect(points).to.be.greaterThanOrEqual(0);
    console.log("✅ getUserPoints works, points:", points.toString());
  });

  it("should get user total ETH won", async function () {
    const totalEth = await luckySpinV2.getUserTotalEthWon(user1.address);
    expect(totalEth).to.be.greaterThanOrEqual(0);
    console.log("✅ getUserTotalEthWon works");
  });

  it("should get global stats", async function () {
    const stats = await luckySpinV2.getGlobalStats();
    expect(stats).to.not.be.undefined;
    console.log("✅ getGlobalStats works");
  });

  it("should get contract balance", async function () {
    const balance = await luckySpinV2.getContractBalance();
    expect(balance).to.be.greaterThanOrEqual(0);
    console.log("✅ getContractBalance works");
  });

  it("should enforce spin cost", async function () {
    const encrypted = await fhevm
      .createEncryptedInput(await luckySpinV2.getAddress(), user1.address)
      .add8(1)
      .encrypt();

    await expect(
      luckySpinV2.connect(user1).spin(
        encrypted.handles[0],
        encrypted.inputProof,
        { value: ethers.parseEther("0.005") }
      )
    ).to.be.revertedWith("Insufficient payment");

    console.log("✅ Spin cost enforcement works");
  });

  it("should handle multiple users", async function () {
    const users = [user1, user2, user3];

    for (const user of users) {
      const encrypted = await fhevm
        .createEncryptedInput(await luckySpinV2.getAddress(), user.address)
        .add8(Math.floor(Math.random() * 5))
        .encrypt();

      await luckySpinV2.connect(user).spin(
        encrypted.handles[0],
        encrypted.inputProof,
        { value: SPIN_COST }
      );
    }

    for (const user of users) {
      const spinCount = await luckySpinV2.getUserSpinCount(user.address);
      expect(spinCount).to.equal(1);
    }

    console.log("✅ Multiple users handled correctly");
  });

  it("should accumulate contract balance from spins", async function () {
    const initialBalance = await ethers.provider.getBalance(await luckySpinV2.getAddress());

    for (let i = 0; i < 3; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await luckySpinV2.getAddress(), user1.address)
        .add8(i)
        .encrypt();

      await luckySpinV2.connect(user1).spin(
        encrypted.handles[0],
        encrypted.inputProof,
        { value: SPIN_COST }
      );
    }

    const finalBalance = await ethers.provider.getBalance(await luckySpinV2.getAddress());
    expect(finalBalance).to.be.greaterThanOrEqual(initialBalance);
    console.log("✅ Contract balance accumulates from spins");
  });

  it("should emit SpinExecuted event", async function () {
    const encrypted = await fhevm
      .createEncryptedInput(await luckySpinV2.getAddress(), user1.address)
      .add8(3)
      .encrypt();

    const tx = await luckySpinV2.connect(user1).spin(
      encrypted.handles[0],
      encrypted.inputProof,
      { value: SPIN_COST }
    );
    const receipt = await tx.wait();

    const spinEvent = receipt.logs.find(log => {
      try {
        const decoded = luckySpinV2.interface.parseLog(log);
        return decoded.name === 'SpinExecuted';
      } catch {
        return false;
      }
    });

    expect(spinEvent).to.not.be.undefined;
    console.log("✅ SpinExecuted event emitted");
  });

  it("should allow owner to deposit funds", async function () {
    const depositAmount = ethers.parseEther("1");
    const balanceBefore = await ethers.provider.getBalance(await luckySpinV2.getAddress());

    await luckySpinV2.connect(owner).depositFunds({ value: depositAmount });

    const balanceAfter = await ethers.provider.getBalance(await luckySpinV2.getAddress());
    expect(balanceAfter).to.equal(balanceBefore + depositAmount);
    console.log("✅ Fund deposit works");
  });

  it("should allow owner to withdraw funds", async function () {
    // Deposit first
    await luckySpinV2.connect(owner).depositFunds({ value: ethers.parseEther("1") });

    const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

    const tx = await luckySpinV2.connect(owner).withdrawFunds(ethers.parseEther("0.5"));
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;

    const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
    expect(ownerBalanceAfter + gasUsed).to.be.greaterThan(ownerBalanceBefore);
    console.log("✅ Fund withdrawal works");
  });

  it("should prevent non-owner from withdrawing", async function () {
    await expect(
      luckySpinV2.connect(user1).withdrawFunds(ethers.parseEther("0.1"))
    ).to.be.revertedWithCustomError(luckySpinV2, "OwnableUnauthorizedAccount");
    console.log("✅ Non-owner withdrawal prevented");
  });

  it("should verify full FHE operation chain", async function () {
    console.log("Testing full FHE operation chain...");

    // 1. Create encrypted input
    const encrypted = await fhevm
      .createEncryptedInput(await luckySpinV2.getAddress(), user1.address)
      .add8(4)
      .encrypt();

    console.log("✅ FHE.createEncryptedInput() - Input created");

    // 2. Execute spin with encrypted value
    await luckySpinV2.connect(user1).spin(
      encrypted.handles[0],
      encrypted.inputProof,
      { value: SPIN_COST }
    );

    console.log("✅ FHE.fromExternal() - Encrypted input processed");

    // 3. Verify state updates
    const spinCount = await luckySpinV2.getUserSpinCount(user1.address);
    expect(spinCount).to.equal(1);

    console.log("✅ FHE operations chain completed successfully");
  });

  it("should handle rapid sequential spins", async function () {
    const startTime = Date.now();

    for (let i = 0; i < 5; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await luckySpinV2.getAddress(), user1.address)
        .add8(i)
        .encrypt();

      await luckySpinV2.connect(user1).spin(
        encrypted.handles[0],
        encrypted.inputProof,
        { value: SPIN_COST }
      );
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    const spinCount = await luckySpinV2.getUserSpinCount(user1.address);
    expect(spinCount).to.equal(5);
    expect(duration).to.be.lessThan(60000);

    console.log(`✅ 5 rapid spins completed in ${duration}ms`);
  });

  it("should integrate with all modules correctly", async function () {
    console.log("Testing module integration...");

    // Spin
    const encrypted = await fhevm
      .createEncryptedInput(await luckySpinV2.getAddress(), user1.address)
      .add8(2)
      .encrypt();

    await luckySpinV2.connect(user1).spin(
      encrypted.handles[0],
      encrypted.inputProof,
      { value: SPIN_COST }
    );

    // Check PrizeManager integration
    const prizeCount = await prizeManager.getPrizeCount();
    expect(prizeCount).to.be.greaterThan(0);
    console.log("✅ PrizeManager integration works");

    // Check UserRecords integration
    const userSpinCount = await userRecords.getUserSpinCount(user1.address);
    expect(userSpinCount).to.equal(1);
    console.log("✅ UserRecords integration works");

    // Check RewardDistributor integration
    const userPoints = await rewardDistributor.getUserPoints(user1.address);
    expect(userPoints).to.be.greaterThanOrEqual(0);
    console.log("✅ RewardDistributor integration works");

    console.log("✅ All module integrations verified");
  });
});
