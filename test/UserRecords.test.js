const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("UserRecords - User Spin History Tests", function () {
  let userRecords;
  let owner, user1, user2;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();
    [owner, user1, user2] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("UserRecords");
    userRecords = await Factory.deploy();
    await userRecords.waitForDeployment();
  });

  it("should deploy UserRecords successfully", async function () {
    expect(await userRecords.getAddress()).to.be.properAddress;
    console.log("✅ UserRecords deployed at:", await userRecords.getAddress());
  });

  it("should have correct owner", async function () {
    const contractOwner = await userRecords.owner();
    expect(contractOwner).to.equal(owner.address);
    console.log("✅ Owner is correct");
  });

  it("should have correct max daily spins constant", async function () {
    const maxDailySpins = await userRecords.MAX_DAILY_SPINS();
    expect(maxDailySpins).to.equal(10);
    console.log("✅ Max daily spins is correct");
  });

  it("should authorize caller correctly", async function () {
    await userRecords.connect(owner).setAuthorizedCaller(user1.address, true);
    const isAuthorized = await userRecords.authorizedCallers(user1.address);
    expect(isAuthorized).to.equal(true);
    console.log("✅ Caller authorization works");
  });

  it("should record spin with encrypted result", async function () {
    await userRecords.connect(owner).setAuthorizedCaller(owner.address, true);

    // Create encrypted result
    const encrypted = await fhevm
      .createEncryptedInput(await userRecords.getAddress(), owner.address)
      .add8(3) // Prize index 3
      .encrypt();

    await userRecords.connect(owner).recordSpin(
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );

    const spinCount = await userRecords.getUserSpinCount(user1.address);
    expect(spinCount).to.equal(1);
    console.log("✅ Spin recorded with encrypted result");
  });

  it("should track remaining spins correctly", async function () {
    await userRecords.connect(owner).setAuthorizedCaller(owner.address, true);

    // Initial remaining spins
    const initialRemaining = await userRecords.getRemainingSpins(user1.address);
    expect(initialRemaining).to.equal(10);

    // Record a spin
    const encrypted = await fhevm
      .createEncryptedInput(await userRecords.getAddress(), owner.address)
      .add8(1)
      .encrypt();

    await userRecords.connect(owner).recordSpin(
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );

    const remainingAfter = await userRecords.getRemainingSpins(user1.address);
    expect(remainingAfter).to.equal(9);
    console.log("✅ Remaining spins tracked correctly");
  });

  it("should enforce daily spin limit", async function () {
    await userRecords.connect(owner).setAuthorizedCaller(owner.address, true);

    // Record 10 spins (max daily limit)
    for (let i = 0; i < 10; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await userRecords.getAddress(), owner.address)
        .add8(i % 5)
        .encrypt();

      await userRecords.connect(owner).recordSpin(
        user1.address,
        encrypted.handles[0],
        encrypted.inputProof
      );
    }

    // 11th spin should fail
    const encrypted = await fhevm
      .createEncryptedInput(await userRecords.getAddress(), owner.address)
      .add8(0)
      .encrypt();

    await expect(
      userRecords.connect(owner).recordSpin(
        user1.address,
        encrypted.handles[0],
        encrypted.inputProof
      )
    ).to.be.revertedWithCustomError(userRecords, "DailyLimitReached");

    console.log("✅ Daily spin limit enforced");
  });

  it("should reset daily spins after day passes", async function () {
    await userRecords.connect(owner).setAuthorizedCaller(owner.address, true);

    // Record some spins
    for (let i = 0; i < 5; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await userRecords.getAddress(), owner.address)
        .add8(i)
        .encrypt();

      await userRecords.connect(owner).recordSpin(
        user1.address,
        encrypted.handles[0],
        encrypted.inputProof
      );
    }

    // Advance time by 1 day
    await ethers.provider.send("evm_increaseTime", [86400]);
    await ethers.provider.send("evm_mine", []);

    // Should have full spins again
    const remaining = await userRecords.getRemainingSpins(user1.address);
    expect(remaining).to.equal(10);

    console.log("✅ Daily spins reset after day passes");
  });

  it("should get user spin count", async function () {
    await userRecords.connect(owner).setAuthorizedCaller(owner.address, true);

    for (let i = 0; i < 3; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await userRecords.getAddress(), owner.address)
        .add8(i)
        .encrypt();

      await userRecords.connect(owner).recordSpin(
        user1.address,
        encrypted.handles[0],
        encrypted.inputProof
      );
    }

    const spinCount = await userRecords.getUserSpinCount(user1.address);
    expect(spinCount).to.equal(3);
    console.log("✅ User spin count retrieved correctly");
  });

  it("should get encrypted spin result", async function () {
    await userRecords.connect(owner).setAuthorizedCaller(owner.address, true);

    const prizeIndex = 2;
    const encrypted = await fhevm
      .createEncryptedInput(await userRecords.getAddress(), owner.address)
      .add8(prizeIndex)
      .encrypt();

    await userRecords.connect(owner).recordSpin(
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );

    // Get the encrypted result (returns euint8)
    const result = await userRecords.getSpinResult(user1.address, 0);
    expect(result).to.not.be.undefined;
    console.log("✅ Encrypted spin result retrieved");
  });

  it("should revert for invalid spin ID", async function () {
    await expect(
      userRecords.getSpinResult(user1.address, 999)
    ).to.be.revertedWithCustomError(userRecords, "InvalidSpinId");

    console.log("✅ Invalid spin ID reverted correctly");
  });

  it("should prevent unauthorized caller from recording", async function () {
    const encrypted = await fhevm
      .createEncryptedInput(await userRecords.getAddress(), user1.address)
      .add8(1)
      .encrypt();

    await expect(
      userRecords.connect(user1).recordSpin(
        user1.address,
        encrypted.handles[0],
        encrypted.inputProof
      )
    ).to.be.revertedWithCustomError(userRecords, "UnauthorizedCaller");

    console.log("✅ Unauthorized caller prevented");
  });

  it("should handle multiple users independently", async function () {
    await userRecords.connect(owner).setAuthorizedCaller(owner.address, true);

    // User1 spins 3 times
    for (let i = 0; i < 3; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await userRecords.getAddress(), owner.address)
        .add8(i)
        .encrypt();

      await userRecords.connect(owner).recordSpin(
        user1.address,
        encrypted.handles[0],
        encrypted.inputProof
      );
    }

    // User2 spins 5 times
    for (let i = 0; i < 5; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await userRecords.getAddress(), owner.address)
        .add8(i)
        .encrypt();

      await userRecords.connect(owner).recordSpin(
        user2.address,
        encrypted.handles[0],
        encrypted.inputProof
      );
    }

    expect(await userRecords.getUserSpinCount(user1.address)).to.equal(3);
    expect(await userRecords.getUserSpinCount(user2.address)).to.equal(5);
    expect(await userRecords.getRemainingSpins(user1.address)).to.equal(7);
    expect(await userRecords.getRemainingSpins(user2.address)).to.equal(5);

    console.log("✅ Multiple users tracked independently");
  });

  it("should emit SpinRecorded event", async function () {
    await userRecords.connect(owner).setAuthorizedCaller(owner.address, true);

    const encrypted = await fhevm
      .createEncryptedInput(await userRecords.getAddress(), owner.address)
      .add8(4)
      .encrypt();

    const tx = await userRecords.connect(owner).recordSpin(
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );
    const receipt = await tx.wait();

    const event = receipt.logs.find(log => {
      try {
        const decoded = userRecords.interface.parseLog(log);
        return decoded.name === 'SpinRecorded';
      } catch {
        return false;
      }
    });

    expect(event).to.not.be.undefined;
    console.log("✅ SpinRecorded event emitted");
  });

  it("should verify FHE operations: fromExternal and storage", async function () {
    await userRecords.connect(owner).setAuthorizedCaller(owner.address, true);

    console.log("Testing FHE operations...");

    const encrypted = await fhevm
      .createEncryptedInput(await userRecords.getAddress(), owner.address)
      .add8(3)
      .encrypt();

    await userRecords.connect(owner).recordSpin(
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );

    console.log("✅ FHE.fromExternal() - Encrypted result conversion works");

    const result = await userRecords.getSpinResult(user1.address, 0);
    expect(result).to.not.be.undefined;

    console.log("✅ FHE encrypted storage - Result stored and retrieved correctly");
  });

  it("should handle rapid sequential operations", async function () {
    await userRecords.connect(owner).setAuthorizedCaller(owner.address, true);

    const startTime = Date.now();

    for (let i = 0; i < 10; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await userRecords.getAddress(), owner.address)
        .add8(i % 5)
        .encrypt();

      await userRecords.connect(owner).recordSpin(
        user1.address,
        encrypted.handles[0],
        encrypted.inputProof
      );
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(await userRecords.getUserSpinCount(user1.address)).to.equal(10);
    expect(duration).to.be.lessThan(60000);

    console.log(`✅ 10 rapid spin recordings completed in ${duration}ms`);
  });
});
