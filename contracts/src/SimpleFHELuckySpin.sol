// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint8, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SimpleFHELuckySpin
 * @notice 简化的FHE转盘游戏 - 最小化实现
 * @dev 用户转盘时，前端随机选择奖品并加密上链
 */
contract SimpleFHELuckySpin is SepoliaConfig, Ownable, ReentrancyGuard {
    
    // 奖品结构
    struct Prize {
        string name;
        uint256 value; // ETH价值 (wei)
        uint8 probability; // 概率 (0-100)
        bool active;
    }
    
    // 转盘记录
    struct SpinRecord {
        address user;
        uint256 timestamp;
        euint8 encryptedPrize; // 加密的奖品索引
        bool claimed;
        string prizeName;
        uint256 prizeValue;
    }
    
    // 状态变量
    Prize[] public prizes;
    mapping(address => SpinRecord[]) public userSpins;
    mapping(address => uint256) public dailySpinCount;
    mapping(address => uint256) public lastSpinDate;
    
    // 常量
    uint256 public constant SPIN_COST = 0.01 ether;
    uint256 public constant MAX_DAILY_SPINS = 10;
    
    // 事件
    event SpinExecuted(address indexed user, uint256 spinId, uint256 timestamp);
    event PrizeClaimed(address indexed user, uint256 spinId, string prizeName, uint256 prizeValue);
    event PrizeAdded(uint256 indexed prizeId, string name, uint256 value, uint8 probability);
    
    // 错误
    error InsufficientPayment();
    error DailyLimitExceeded();
    error AlreadyClaimed();
    error InvalidPrizeId();
    error InvalidProbability();
    
    constructor() Ownable(msg.sender) {
        // 初始化默认奖品
        _addPrize("Thank You", 0, 40);
        _addPrize("100 Points", 0, 30);
        _addPrize("500 Points", 0, 20);
        _addPrize("0.1 ETH", 0.1 ether, 8);
        _addPrize("0.5 ETH", 0.5 ether, 2);
    }
    
    /**
     * @notice 执行转盘 - 接收前端加密的奖品索引
     * @param encryptedPrizeIndex 加密的奖品索引（externalEuint8）
     * @param proof 加密证明
     */
    function spin(externalEuint8 encryptedPrizeIndex, bytes calldata proof) 
        external 
        payable 
        nonReentrant 
    {
        // 检查支付
        if (msg.value != SPIN_COST) {
            revert InsufficientPayment();
        }
        
        // 检查每日限制
        if (!_checkDailyLimit(msg.sender)) {
            revert DailyLimitExceeded();
        }
        
        // 从外部加密数据转换为内部euint8
        euint8 prizeIndex = FHE.fromExternal(encryptedPrizeIndex, proof);
        
        // 授权合约访问加密数据
        FHE.allowThis(prizeIndex);
        
        // 授权用户访问自己的加密数据
        FHE.allow(prizeIndex, msg.sender);
        
        // 记录转盘
        uint256 spinId = userSpins[msg.sender].length;
        userSpins[msg.sender].push(SpinRecord({
            user: msg.sender,
            timestamp: block.timestamp,
            encryptedPrize: prizeIndex,
            claimed: false,
            prizeName: "",
            prizeValue: 0
        }));
        
        // 更新每日计数
        _incrementDailyCount(msg.sender);
        
        emit SpinExecuted(msg.sender, spinId, block.timestamp);
    }
    
    /**
     * @notice 领取奖品 - 使用解密后的奖品索引
     * @param spinId 转盘记录ID
     * @param decryptedPrizeIndex 解密后的奖品索引
     */
    function claimPrize(uint256 spinId, uint8 decryptedPrizeIndex) external nonReentrant {
        SpinRecord storage record = userSpins[msg.sender][spinId];
        
        // 检查是否已领取
        if (record.claimed) {
            revert AlreadyClaimed();
        }
        
        // 验证奖品索引
        if (decryptedPrizeIndex >= prizes.length) {
            revert InvalidPrizeId();
        }
        
        // 获取奖品信息
        Prize memory prize = prizes[decryptedPrizeIndex];
        
        // 更新记录
        record.claimed = true;
        record.prizeName = prize.name;
        record.prizeValue = prize.value;
        
        // 发放奖品
        if (prize.value > 0) {
            payable(msg.sender).transfer(prize.value);
        }
        
        emit PrizeClaimed(msg.sender, spinId, prize.name, prize.value);
    }
    
    /**
     * @notice 添加奖品 (仅管理员)
     */
    function addPrize(string calldata name, uint256 value, uint8 probability) external onlyOwner {
        _addPrize(name, value, probability);
    }
    
    /**
     * @notice 获取奖品信息
     */
    function getPrize(uint256 prizeId) external view returns (Prize memory) {
        if (prizeId >= prizes.length) {
            revert InvalidPrizeId();
        }
        return prizes[prizeId];
    }
    
    /**
     * @notice 获取奖品数量
     */
    function getPrizeCount() external view returns (uint256) {
        return prizes.length;
    }
    
    /**
     * @notice 获取用户转盘记录
     */
    function getUserSpinRecord(address user, uint256 spinId) external view returns (SpinRecord memory) {
        return userSpins[user][spinId];
    }
    
    /**
     * @notice 获取用户转盘数量
     */
    function getUserSpinCount(address user) external view returns (uint256) {
        return userSpins[user].length;
    }
    
    /**
     * @notice 获取用户剩余转盘次数
     */
    function getRemainingSpins(address user) external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        
        if (lastSpinDate[user] == today) {
            return MAX_DAILY_SPINS - dailySpinCount[user];
        }
        
        return MAX_DAILY_SPINS;
    }
    
    /**
     * @notice 获取合约余额
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice 提取合约余额 (仅管理员)
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    // 内部函数
    function _addPrize(string memory name, uint256 value, uint8 probability) internal {
        if (probability > 100) {
            revert InvalidProbability();
        }
        
        prizes.push(Prize({
            name: name,
            value: value,
            probability: probability,
            active: true
        }));
        
        emit PrizeAdded(prizes.length - 1, name, value, probability);
    }
    
    function _checkDailyLimit(address user) internal view returns (bool) {
        uint256 today = block.timestamp / 1 days;
        
        if (lastSpinDate[user] == today) {
            return dailySpinCount[user] < MAX_DAILY_SPINS;
        }
        
        return true;
    }
    
    function _incrementDailyCount(address user) internal {
        uint256 today = block.timestamp / 1 days;
        
        if (lastSpinDate[user] != today) {
            dailySpinCount[user] = 0;
            lastSpinDate[user] = today;
        }
        
        dailySpinCount[user]++;
    }
}
