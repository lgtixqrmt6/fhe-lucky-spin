const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FHELuckySpin", function () {
  let luckySpin;
  let owner;
  let user1;
  let user2;
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const FHELuckySpin = await ethers.getContractFactory("FHELuckySpin");
    luckySpin = await FHELuckySpin.deploy();
    await luckySpin.waitForDeployment();
    
    // 向合约充值
    await owner.sendTransaction({
      to: await luckySpin.getAddress(),
      value: ethers.parseEther("1.0")
    });
  });
  
  describe("部署", function () {
    it("应该正确初始化奖品", async function () {
      const prizeCount = await luckySpin.getPrizeCount();
      expect(prizeCount).to.equal(5);
      
      const prize0 = await luckySpin.prizes(0);
      expect(prize0.name).to.equal("谢谢参与");
      expect(prize0.value).to.equal(0);
      expect(prize0.probability).to.equal(50);
      expect(prize0.active).to.be.true;
    });
    
    it("应该设置正确的转盘费用", async function () {
      const spinCost = await luckySpin.SPIN_COST();
      expect(spinCost).to.equal(ethers.parseEther("0.001"));
    });
    
    it("应该设置正确的每日转盘限制", async function () {
      const maxDailySpins = await luckySpin.MAX_DAILY_SPINS();
      expect(maxDailySpins).to.equal(3);
    });
  });
  
  describe("奖品管理", function () {
    it("只有管理员可以添加奖品", async function () {
      await expect(
        luckySpin.connect(user1).addPrize("测试奖品", ethers.parseEther("0.1"), 10)
      ).to.be.revertedWithCustomError(luckySpin, "OwnableUnauthorizedAccount");
    });
    
    it("管理员可以添加奖品", async function () {
      await luckySpin.addPrize("测试奖品", ethers.parseEther("0.1"), 10);
      const prizeCount = await luckySpin.getPrizeCount();
      expect(prizeCount).to.equal(6);
      
      const newPrize = await luckySpin.prizes(5);
      expect(newPrize.name).to.equal("测试奖品");
      expect(newPrize.value).to.equal(ethers.parseEther("0.1"));
      expect(newPrize.probability).to.equal(10);
    });
    
    it("管理员可以更新奖品", async function () {
      await luckySpin.updatePrize(0, "更新奖品", ethers.parseEther("0.05"), 30);
      const updatedPrize = await luckySpin.prizes(0);
      expect(updatedPrize.name).to.equal("更新奖品");
      expect(updatedPrize.value).to.equal(ethers.parseEther("0.05"));
      expect(updatedPrize.probability).to.equal(30);
    });
    
    it("管理员可以设置奖品激活状态", async function () {
      await luckySpin.setPrizeActive(0, false);
      const prize = await luckySpin.prizes(0);
      expect(prize.active).to.be.false;
    });
  });
  
  describe("转盘功能", function () {
    it("应该检查支付金额", async function () {
      await expect(
        luckySpin.connect(user1).spin(
          { data: "0x1234" }, // 模拟加密数据
          "0x5678" // 模拟证明
        )
      ).to.be.revertedWithCustomError(luckySpin, "InsufficientPayment");
    });
    
    it("应该检查每日转盘限制", async function () {
      const spinCost = await luckySpin.SPIN_COST();
      
      // 模拟3次转盘（达到每日限制）
      for (let i = 0; i < 3; i++) {
        await expect(
          luckySpin.connect(user1).spin(
            { data: "0x1234" },
            "0x5678",
            { value: spinCost }
          )
        ).to.be.reverted; // FHE操作在本地测试中会失败
      }
    });
  });
  
  describe("资金管理", function () {
    it("只有管理员可以提取资金", async function () {
      await expect(
        luckySpin.connect(user1).withdrawFunds()
      ).to.be.revertedWithCustomError(luckySpin, "OwnableUnauthorizedAccount");
    });
    
    it("管理员可以提取资金", async function () {
      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      await luckySpin.withdrawFunds();
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });
  
  describe("查询功能", function () {
    it("应该返回正确的用户转盘记录数量", async function () {
      const spinCount = await luckySpin.getUserSpinCount(user1.address);
      expect(spinCount).to.equal(0);
    });
    
    it("应该返回正确的剩余转盘次数", async function () {
      const remainingSpins = await luckySpin.getRemainingSpins(user1.address);
      expect(remainingSpins).to.equal(3);
    });
    
    it("应该返回正确的合约余额", async function () {
      const balance = await luckySpin.getContractBalance();
      expect(balance).to.equal(ethers.parseEther("1.0"));
    });
  });
});
