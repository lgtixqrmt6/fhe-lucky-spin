// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint8, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ISpinManager} from "../interfaces/ISpinManager.sol";
import {IPrizeManager} from "../interfaces/IPrizeManager.sol";

/**
 * @title SpinManager
 * @notice Manages encrypted spin logic and result calculation using FHE
 */
contract SpinManager is SepoliaConfig, ISpinManager, Ownable {

    // Constants
    uint256 public constant SPIN_COST = 0.01 ether;

    // Prize manager reference
    IPrizeManager public prizeManager;

    // Authorization
    mapping(address => bool) public authorized;

    // Errors
    error Unauthorized();
    error PrizeManagerNotSet();

    // Modifiers
    modifier onlyAuthorized() {
        if (!authorized[msg.sender] && msg.sender != owner()) {
            revert Unauthorized();
        }
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Set authorization for a contract
     * @param account Address to authorize
     * @param status Authorization status
     */
    function setAuthorization(address account, bool status) external onlyOwner {
        authorized[account] = status;
    }

    /**
     * @notice Set prize manager reference
     * @param _prizeManager Address of prize manager contract
     */
    function setPrizeManager(address _prizeManager) external onlyOwner {
        prizeManager = IPrizeManager(_prizeManager);
    }

    /**
     * @notice Execute spin and calculate encrypted result
     * @param user Address of the user spinning
     * @param encryptedRandom Encrypted random number from user
     * @param proof Proof for encrypted random number
     * @return result Encrypted spin result
     */
    function executeSpin(
        address user,
        externalEuint8 encryptedRandom,
        bytes calldata proof
    ) external override onlyAuthorized returns (euint8 result) {
        if (address(prizeManager) == address(0)) {
            revert PrizeManagerNotSet();
        }

        // Convert external encrypted data to internal format
        euint8 randomValue = FHE.fromExternal(encryptedRandom, proof);
        
        // ✅ 授权合约访问随机值
        FHE.allowThis(randomValue);

        // Calculate encrypted result
        result = calculateSpinResult(randomValue);

        // ✅ 授权合约访问结果
        FHE.allowThis(result);
        
        // ✅ 授权用户访问结果（用于解密）
        FHE.allow(result, user);

        emit SpinExecuted(user, 0, block.timestamp, SPIN_COST);

        return result;
    }

    /**
     * @notice Calculate spin result based on encrypted random value
     * @param randomValue Encrypted random number
     * @return Encrypted prize index
     */
    function calculateSpinResult(euint8 randomValue) public override returns (euint8) {
        if (address(prizeManager) == address(0)) {
            revert PrizeManagerNotSet();
        }

        // Normalize random value to 0-99 range
        euint8 normalizedRandom = FHE.rem(randomValue, 100);
        
        // ✅ 授权合约访问标准化后的随机值
        FHE.allowThis(normalizedRandom);

        // Get prize count
        uint256 prizeCount = prizeManager.getPrizeCount();

        // Calculate result based on probability distribution using FHE operations
        euint8 result = FHE.asEuint8(0);
        uint8 cumulativeProbability = 0;

        for (uint256 i = 0; i < prizeCount; i++) {
            IPrizeManager.Prize memory prize = prizeManager.getPrize(i);

            if (prize.active) {
                cumulativeProbability += prize.probability;

                // Check if random number falls within this prize's range
                // If normalizedRandom < cumulativeProbability, this is the winning prize
                ebool isWinner = FHE.lt(normalizedRandom, FHE.asEuint8(cumulativeProbability));

                // Select this prize index if winner, otherwise keep previous result
                result = FHE.select(isWinner, FHE.asEuint8(uint8(i)), result);
            }
        }

        // ✅ 授权合约访问最终结果
        FHE.allowThis(result);

        return result;
    }

    /**
     * @notice Get spin cost
     * @return Spin cost in wei
     */
    function getSpinCost() external pure override returns (uint256) {
        return SPIN_COST;
    }
}
