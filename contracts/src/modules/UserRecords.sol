// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {euint8} from "@fhevm/solidity/lib/FHE.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IUserRecords} from "../interfaces/IUserRecords.sol";

/**
 * @title UserRecords
 * @notice Tracks user spin history and enforces daily limits
 */
contract UserRecords is IUserRecords, Ownable {

    // Constants
    uint256 public constant MAX_DAILY_SPINS = 10;

    // State variables
    mapping(address => SpinRecord[]) private userSpins;
    mapping(address => uint256) private dailySpinCount;
    mapping(address => uint256) private lastSpinDate;

    // Authorization
    mapping(address => bool) public authorized;

    // Errors
    error Unauthorized();
    error DailyLimitExceeded();
    error InvalidSpinId();

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
     * @notice Record a new spin for a user
     * @param user Address of the user
     * @param result Encrypted spin result
     * @return spinId ID of the recorded spin
     */
    function recordSpin(address user, euint8 result)
        external
        override
        onlyAuthorized
        returns (uint256 spinId)
    {
        // Create new spin record
        spinId = userSpins[user].length;
        userSpins[user].push(SpinRecord({
            timestamp: block.timestamp,
            result: result,
            claimed: false,
            prizeValue: 0,
            prizeType: PrizeType.POINTS,
            prizeName: ""
        }));

        emit SpinRecorded(user, spinId, block.timestamp);
        return spinId;
    }

    /**
     * @notice Update spin record after prize claim
     * @param user Address of the user
     * @param spinId ID of the spin
     * @param prizeValue Value of the prize
     * @param prizeType Type of prize
     * @param prizeName Name of the prize
     */
    function updateSpinClaim(
        address user,
        uint256 spinId,
        uint256 prizeValue,
        PrizeType prizeType,
        string calldata prizeName
    ) external override onlyAuthorized {
        if (spinId >= userSpins[user].length) {
            revert InvalidSpinId();
        }

        SpinRecord storage record = userSpins[user][spinId];
        record.claimed = true;
        record.prizeValue = prizeValue;
        record.prizeType = prizeType;
        record.prizeName = prizeName;

        emit PrizeClaimedRecord(user, spinId, prizeName, prizeValue);
    }

    /**
     * @notice Check if user can spin (within daily limit)
     * @param user Address of the user
     * @return canSpin True if user can spin
     */
    function checkDailyLimit(address user) external view override returns (bool canSpin) {
        uint256 today = block.timestamp / 1 days;

        if (lastSpinDate[user] == today) {
            return dailySpinCount[user] < MAX_DAILY_SPINS;
        }

        // New day, user can spin
        return true;
    }

    /**
     * @notice Increment daily spin count for user
     * @param user Address of the user
     */
    function incrementDailyCount(address user) external override onlyAuthorized {
        uint256 today = block.timestamp / 1 days;

        if (lastSpinDate[user] != today) {
            // New day, reset count
            dailySpinCount[user] = 0;
            lastSpinDate[user] = today;
        }

        if (dailySpinCount[user] >= MAX_DAILY_SPINS) {
            revert DailyLimitExceeded();
        }

        dailySpinCount[user]++;
    }

    /**
     * @notice Get remaining spins for user today
     * @param user Address of the user
     * @return Number of remaining spins
     */
    function getRemainingSpins(address user) external view override returns (uint256) {
        uint256 today = block.timestamp / 1 days;

        if (lastSpinDate[user] == today) {
            return MAX_DAILY_SPINS - dailySpinCount[user];
        }

        return MAX_DAILY_SPINS;
    }

    /**
     * @notice Get total number of spins for a user
     * @param user Address of the user
     * @return Number of spins
     */
    function getUserSpinCount(address user) external view override returns (uint256) {
        return userSpins[user].length;
    }

    /**
     * @notice Get spin record details
     * @param user Address of the user
     * @param spinId ID of the spin
     * @return Spin record details
     */
    function getSpinRecord(address user, uint256 spinId)
        external
        view
        override
        returns (SpinRecord memory)
    {
        if (spinId >= userSpins[user].length) {
            revert InvalidSpinId();
        }
        return userSpins[user][spinId];
    }

    /**
     * @notice Get daily spin count for user
     * @param user Address of the user
     * @return Daily spin count
     */
    function getDailySpinCount(address user) external view override returns (uint256) {
        uint256 today = block.timestamp / 1 days;

        if (lastSpinDate[user] == today) {
            return dailySpinCount[user];
        }

        return 0;
    }

    /**
     * @notice Get maximum daily spins allowed
     * @return Maximum spins per day
     */
    function getMaxDailySpins() external pure override returns (uint256) {
        return MAX_DAILY_SPINS;
    }

    /**
     * @notice Get encrypted spin result for decryption verification
     * @param user Address of the user
     * @param spinId ID of the spin
     * @return Encrypted spin result
     */
    function getEncryptedSpinResult(address user, uint256 spinId) 
        external 
        view 
        override 
        returns (euint8) 
    {
        if (spinId >= userSpins[user].length) {
            revert InvalidSpinId();
        }
        return userSpins[user][spinId].result;
    }
}
