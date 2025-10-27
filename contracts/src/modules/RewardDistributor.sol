// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IRewardDistributor} from "../interfaces/IRewardDistributor.sol";

/**
 * @title RewardDistributor
 * @notice Manages prize distribution including points and ETH rewards
 */
contract RewardDistributor is IRewardDistributor, Ownable, ReentrancyGuard {

    // State variables
    mapping(address => uint256) private userPoints;
    mapping(address => uint256) private userTotalEthWon;
    uint256 private totalPointsDistributed;
    uint256 private totalEthDistributed;

    // Authorization
    mapping(address => bool) public authorized;

    // Errors
    error Unauthorized();
    error InsufficientContractBalance();
    error TransferFailed();
    error InvalidAmount();

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
     * @notice Distribute prize to user
     * @param user Address of the user
     * @param value Value of the prize
     * @param prizeType Type of prize (POINTS or ETH)
     */
    function distributePrize(
        address user,
        uint256 value,
        PrizeType prizeType
    ) external override onlyAuthorized nonReentrant {
        if (value == 0) {
            // No prize, just return
            return;
        }

        if (prizeType == PrizeType.POINTS) {
            // Award points
            userPoints[user] += value;
            totalPointsDistributed += value;
            emit PointsAwarded(user, value);
        } else if (prizeType == PrizeType.ETH) {
            // Award ETH
            if (address(this).balance < value) {
                revert InsufficientContractBalance();
            }

            (bool success, ) = payable(user).call{value: value}("");
            if (!success) {
                revert TransferFailed();
            }

            userTotalEthWon[user] += value;
            totalEthDistributed += value;
            emit EthPrizeAwarded(user, value);
        }
    }

    /**
     * @notice Deposit funds to contract
     */
    function depositFunds() external payable override {
        emit FundsDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw funds from contract (owner only)
     * @param amount Amount to withdraw
     */
    function withdrawFunds(uint256 amount) external override onlyOwner nonReentrant {
        if (amount == 0) {
            revert InvalidAmount();
        }

        if (address(this).balance < amount) {
            revert InsufficientContractBalance();
        }

        (bool success, ) = payable(owner()).call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }

        emit FundsWithdrawn(owner(), amount);
    }

    /**
     * @notice Get user points balance
     * @param user Address of the user
     * @return Points balance
     */
    function getUserPoints(address user) external view override returns (uint256) {
        return userPoints[user];
    }

    /**
     * @notice Get total ETH won by user
     * @param user Address of the user
     * @return Total ETH won
     */
    function getUserTotalEthWon(address user) external view override returns (uint256) {
        return userTotalEthWon[user];
    }

    /**
     * @notice Get total points distributed
     * @return Total points
     */
    function getTotalPointsDistributed() external view override returns (uint256) {
        return totalPointsDistributed;
    }

    /**
     * @notice Get total ETH distributed
     * @return Total ETH
     */
    function getTotalEthDistributed() external view override returns (uint256) {
        return totalEthDistributed;
    }

    /**
     * @notice Get contract balance
     * @return Contract balance in wei
     */
    function getContractBalance() external view override returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Receive ETH
     */
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }
}
