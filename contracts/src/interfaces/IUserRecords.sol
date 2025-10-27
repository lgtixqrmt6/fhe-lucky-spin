// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {euint8} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title IUserRecords
 * @notice Interface for tracking user spin history and daily limits
 */
interface IUserRecords {

    enum PrizeType {
        POINTS,
        ETH
    }

    struct SpinRecord {
        uint256 timestamp;
        euint8 result;
        bool claimed;
        uint256 prizeValue;
        PrizeType prizeType;
        string prizeName;
    }

    // Events
    event SpinRecorded(address indexed user, uint256 spinId, uint256 timestamp);
    event PrizeClaimedRecord(address indexed user, uint256 spinId, string prizeName, uint256 prizeValue);

    // Record management
    function recordSpin(address user, euint8 result) external returns (uint256 spinId);
    function updateSpinClaim(
        address user,
        uint256 spinId,
        uint256 prizeValue,
        PrizeType prizeType,
        string calldata prizeName
    ) external;

    // Daily limit tracking
    function checkDailyLimit(address user) external view returns (bool canSpin);
    function incrementDailyCount(address user) external;
    function getRemainingSpins(address user) external view returns (uint256);

    // View functions
    function getUserSpinCount(address user) external view returns (uint256);
    function getSpinRecord(address user, uint256 spinId) external view returns (SpinRecord memory);
    function getEncryptedSpinResult(address user, uint256 spinId) external view returns (euint8);
    function getDailySpinCount(address user) external view returns (uint256);
    function getMaxDailySpins() external pure returns (uint256);
}
