const { expect } = require("chai");
const { ethers, fhevm } = require("hardhat");

describe("SpinManager - FHE Spin Logic Tests", function () {
  let spinManager, prizeManager;
  let owner, user1, user2;
  const SPIN_COST = ethers.parseEther("0.01");

  beforeEach(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test must run in FHEVM mock environment");
    }

    await fhevm.initializeCLIApi();
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy PrizeManager first (dependency)
    const PrizeManagerFactory = await ethers.getContractFactory("PrizeManager");
    prizeManager = await PrizeManagerFactory.deploy();
    await prizeManager.waitForDeployment();

    // Deploy SpinManager with PrizeManager address
    const SpinManagerFactory = await ethers.getContractFactory("SpinManager");
    spinManager = await SpinManagerFactory.deploy(await prizeManager.getAddress());
    await spinManager.waitForDeployment();
  });

  it("should deploy SpinManager successfully", async function () {
    expect(await spinManager.getAddress()).to.be.properAddress;
    console.log("✅ SpinManager deployed at:", await spinManager.getAddress());
  });

  it("should have correct spin cost constant", async function () {
    const spinCost = await spinManager.SPIN_COST();
    expect(spinCost).to.equal(SPIN_COST);
    console.log("✅ Spin cost is correct:", ethers.formatEther(spinCost), "ETH");
  });

  it("should return correct spin cost via getter", async function () {
    const spinCost = await spinManager.getSpinCost();
    expect(spinCost).to.equal(SPIN_COST);
    console.log("✅ getSpinCost() returns correct value");
  });

  it("should have PrizeManager reference set correctly", async function () {
    const prizeManagerAddr = await spinManager.prizeManager();
    expect(prizeManagerAddr).to.equal(await prizeManager.getAddress());
    console.log("✅ PrizeManager reference is correct");
  });

  it("should authorize caller correctly", async function () {
    // Authorize user1
    await spinManager.connect(owner).setAuthorizedCaller(user1.address, true);

    const isAuthorized = await spinManager.authorizedCallers(user1.address);
    expect(isAuthorized).to.equal(true);
    console.log("✅ Caller authorization works");
  });

  it("should revoke caller authorization", async function () {
    // Authorize then revoke
    await spinManager.connect(owner).setAuthorizedCaller(user1.address, true);
    await spinManager.connect(owner).setAuthorizedCaller(user1.address, false);

    const isAuthorized = await spinManager.authorizedCallers(user1.address);
    expect(isAuthorized).to.equal(false);
    console.log("✅ Authorization revocation works");
  });

  it("should prevent non-owner from authorizing callers", async function () {
    await expect(
      spinManager.connect(user1).setAuthorizedCaller(user2.address, true)
    ).to.be.revertedWithCustomError(spinManager, "OwnableUnauthorizedAccount");
    console.log("✅ Non-owner cannot authorize callers");
  });

  it("should emit AuthorizedCallerSet event", async function () {
    const tx = await spinManager.connect(owner).setAuthorizedCaller(user1.address, true);
    const receipt = await tx.wait();

    const event = receipt.logs.find(log => {
      try {
        const decoded = spinManager.interface.parseLog(log);
        return decoded.name === 'AuthorizedCallerSet';
      } catch {
        return false;
      }
    });

    expect(event).to.not.be.undefined;
    console.log("✅ AuthorizedCallerSet event emitted");
  });

  it("should process spin with encrypted random input", async function () {
    // Authorize the contract itself or owner as caller
    await spinManager.connect(owner).setAuthorizedCaller(owner.address, true);

    // Create encrypted random value
    const randomValue = 42;
    const encrypted = await fhevm
      .createEncryptedInput(await spinManager.getAddress(), owner.address)
      .add8(randomValue)
      .encrypt();

    // Process spin (this is typically called by main contract)
    const tx = await spinManager.connect(owner).processSpin(
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );
    await tx.wait();

    console.log("✅ Spin processing with encrypted input works");
  });

  it("should reject unauthorized spin processing", async function () {
    const encrypted = await fhevm
      .createEncryptedInput(await spinManager.getAddress(), user1.address)
      .add8(10)
      .encrypt();

    // User1 is not authorized
    await expect(
      spinManager.connect(user1).processSpin(
        user1.address,
        encrypted.handles[0],
        encrypted.inputProof
      )
    ).to.be.revertedWith("Not authorized");

    console.log("✅ Unauthorized spin processing rejected");
  });

  it("should handle multiple spin processings", async function () {
    await spinManager.connect(owner).setAuthorizedCaller(owner.address, true);

    for (let i = 0; i < 5; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await spinManager.getAddress(), owner.address)
        .add8(i * 10)
        .encrypt();

      await spinManager.connect(owner).processSpin(
        user1.address,
        encrypted.handles[0],
        encrypted.inputProof
      );
    }

    console.log("✅ Multiple spin processings work");
  });

  it("should verify FHE operations: fromExternal for spin input", async function () {
    await spinManager.connect(owner).setAuthorizedCaller(owner.address, true);

    console.log("Testing FHE.fromExternal() for spin input...");

    const encrypted = await fhevm
      .createEncryptedInput(await spinManager.getAddress(), owner.address)
      .add8(128)
      .encrypt();

    await spinManager.connect(owner).processSpin(
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );

    console.log("✅ FHE.fromExternal() - Encrypted random input conversion works");
  });

  it("should handle edge case: maximum uint8 value", async function () {
    await spinManager.connect(owner).setAuthorizedCaller(owner.address, true);

    const encrypted = await fhevm
      .createEncryptedInput(await spinManager.getAddress(), owner.address)
      .add8(255)
      .encrypt();

    await spinManager.connect(owner).processSpin(
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );

    console.log("✅ Maximum uint8 value (255) handled correctly");
  });

  it("should handle edge case: zero value", async function () {
    await spinManager.connect(owner).setAuthorizedCaller(owner.address, true);

    const encrypted = await fhevm
      .createEncryptedInput(await spinManager.getAddress(), owner.address)
      .add8(0)
      .encrypt();

    await spinManager.connect(owner).processSpin(
      user1.address,
      encrypted.handles[0],
      encrypted.inputProof
    );

    console.log("✅ Zero value handled correctly");
  });

  it("should maintain performance under rapid operations", async function () {
    await spinManager.connect(owner).setAuthorizedCaller(owner.address, true);

    const startTime = Date.now();

    for (let i = 0; i < 10; i++) {
      const encrypted = await fhevm
        .createEncryptedInput(await spinManager.getAddress(), owner.address)
        .add8(i % 256)
        .encrypt();

      await spinManager.connect(owner).processSpin(
        user1.address,
        encrypted.handles[0],
        encrypted.inputProof
      );
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).to.be.lessThan(60000);
    console.log(`✅ 10 rapid spin operations completed in ${duration}ms`);
  });
});
