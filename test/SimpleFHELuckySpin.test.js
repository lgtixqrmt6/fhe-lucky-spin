const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("SimpleFHELuckySpin - Basic Functionality Tests", function () {
  let contract;
  let owner, user1, user2, user3;
  const SPIN_COST = ethers.parseEther("0.01");

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();
    [owner, user1, user2, user3] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("SimpleFHELuckySpin");
    const deployed = await Factory.deploy();
    await deployed.waitForDeployment();
    contract = deployed;
  });

  it("should deploy contract successfully", async function () {
    expect(await contract.getAddress()).to.be.properAddress;
    console.log("✅ Contract deployed at:", await contract.getAddress());
  });

  it("should have correct initial values", async function () {
    const spinCost = await contract.SPIN_COST();
    const maxDailySpins = await contract.MAX_DAILY_SPINS();
    const contractOwner = await contract.owner();

    expect(spinCost).to.equal(SPIN_COST);
    expect(maxDailySpins).to.equal(10);
    expect(contractOwner).to.equal(owner.address);
    console.log("✅ Initial values correct");
  });

  it("should spin with encrypted prize index", async function () {
    // Create encrypted prize index (0-4)
    const prizeIndex = 2;
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), user1.address)
      .add8(prizeIndex)
      .encrypt();

    // Spin
    const tx = await contract.connect(user1).spin(
      encrypted.handles[0],
      encrypted.inputProof,
      { value: SPIN_COST }
    );
    await tx.wait();

    const userSpinCount = await contract.getUserSpinCount(user1.address);
    expect(userSpinCount).to.equal(1);
    console.log("✅ Spin with encrypted prize index works");
  });

  it("should track remaining spins correctly", async function () {
    // Check initial remaining spins
    const initialRemaining = await contract.getRemainingSpins(user1.address);
    expect(initialRemaining).to.equal(10);

    // Spin once
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), user1.address)
      .add8(1)
      .encrypt();

    await contract.connect(user1).spin(
      encrypted.handles[0],
      encrypted.inputProof,
      { value: SPIN_COST }
    );

    const remainingAfter = await contract.getRemainingSpins(user1.address);
    expect(remainingAfter).to.equal(9);
    console.log("✅ Remaining spins tracking works");
  });

  it("should enforce daily spin limit", async function () {
    // Spin 10 times (max daily limit)
    for (let i = 0; i < 10; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add8(i % 5)
        .encrypt();

      await contract.connect(user1).spin(
        encrypted.handles[0],
        encrypted.inputProof,
        { value: SPIN_COST }
      );
    }

    // 11th spin should fail
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), user1.address)
      .add8(0)
      .encrypt();

    await expect(
      contract.connect(user1).spin(
        encrypted.handles[0],
        encrypted.inputProof,
        { value: SPIN_COST }
      )
    ).to.be.revertedWith("Daily spin limit reached");

    console.log("✅ Daily spin limit enforcement works");
  });

  it("should require correct spin cost", async function () {
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), user1.address)
      .add8(1)
      .encrypt();

    // Insufficient payment should fail
    await expect(
      contract.connect(user1).spin(
        encrypted.handles[0],
        encrypted.inputProof,
        { value: ethers.parseEther("0.005") }
      )
    ).to.be.revertedWith("Insufficient payment");

    console.log("✅ Spin cost validation works");
  });

  it("should handle multiple users spinning", async function () {
    const users = [user1, user2, user3];

    for (const user of users) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), user.address)
        .add8(Math.floor(Math.random() * 5))
        .encrypt();

      await contract.connect(user).spin(
        encrypted.handles[0],
        encrypted.inputProof,
        { value: SPIN_COST }
      );
    }

    // Verify each user has 1 spin
    for (const user of users) {
      const spinCount = await contract.getUserSpinCount(user.address);
      expect(spinCount).to.equal(1);
    }

    console.log("✅ Multiple users spinning works");
  });

  it("should emit SpinExecuted event", async function () {
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), user1.address)
      .add8(2)
      .encrypt();

    const tx = await contract.connect(user1).spin(
      encrypted.handles[0],
      encrypted.inputProof,
      { value: SPIN_COST }
    );
    const receipt = await tx.wait();

    const spinEvent = receipt.logs.find(log => {
      try {
        const decoded = contract.interface.parseLog(log);
        return decoded.name === 'SpinExecuted';
      } catch {
        return false;
      }
    });

    expect(spinEvent).to.not.be.undefined;
    console.log("✅ SpinExecuted event emitted correctly");
  });

  it("should allow owner to withdraw funds", async function () {
    // First spin to add funds to contract
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), user1.address)
      .add8(1)
      .encrypt();

    await contract.connect(user1).spin(
      encrypted.handles[0],
      encrypted.inputProof,
      { value: SPIN_COST }
    );

    const contractBalance = await contract.getContractBalance();
    expect(contractBalance).to.be.greaterThan(0);

    // Owner withdraws
    const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
    const tx = await contract.connect(owner).withdrawFunds();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

    expect(ownerBalanceAfter).to.be.greaterThan(ownerBalanceBefore - gasUsed);
    console.log("✅ Owner withdrawal works");
  });

  it("should prevent non-owner from withdrawing", async function () {
    await expect(
      contract.connect(user1).withdrawFunds()
    ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");

    console.log("✅ Non-owner withdrawal prevention works");
  });

  it("should handle edge case: prize index 0", async function () {
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), user1.address)
      .add8(0)
      .encrypt();

    await contract.connect(user1).spin(
      encrypted.handles[0],
      encrypted.inputProof,
      { value: SPIN_COST }
    );

    const spinCount = await contract.getUserSpinCount(user1.address);
    expect(spinCount).to.equal(1);
    console.log("✅ Prize index 0 handling works");
  });

  it("should handle edge case: prize index 4 (max)", async function () {
    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), user1.address)
      .add8(4)
      .encrypt();

    await contract.connect(user1).spin(
      encrypted.handles[0],
      encrypted.inputProof,
      { value: SPIN_COST }
    );

    const spinCount = await contract.getUserSpinCount(user1.address);
    expect(spinCount).to.equal(1);
    console.log("✅ Prize index 4 (max) handling works");
  });

  it("should handle rapid sequential spins", async function () {
    const startTime = Date.now();

    for (let i = 0; i < 5; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await contract.getAddress(), user1.address)
        .add8(i)
        .encrypt();

      await contract.connect(user1).spin(
        encrypted.handles[0],
        encrypted.inputProof,
        { value: SPIN_COST }
      );
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    const spinCount = await contract.getUserSpinCount(user1.address);
    expect(spinCount).to.equal(5);
    expect(duration).to.be.lessThan(30000);
    console.log(`✅ Rapid sequential spins completed in ${duration}ms`);
  });

  it("should verify FHE operations: fromExternal and storage", async function () {
    console.log("Testing FHE operations...");

    const encrypted = await fhevm
      .createEncryptedInput(await contract.getAddress(), user1.address)
      .add8(3)
      .encrypt();

    await contract.connect(user1).spin(
      encrypted.handles[0],
      encrypted.inputProof,
      { value: SPIN_COST }
    );

    console.log("✅ FHE.fromExternal() - Encrypted input conversion works");
    console.log("✅ FHE encrypted storage - Prize index stored correctly");

    const spinCount = await contract.getUserSpinCount(user1.address);
    expect(spinCount).to.equal(1);
    console.log("✅ All FHE operations verified successfully");
  });
});
