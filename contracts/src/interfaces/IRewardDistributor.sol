// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IRewardDistributor
 * @notice Interface for managing prize distribution (points and ETH)
 */
interface IRewardDistributor {

    enum PrizeType {
        POINTS,
        ETH
    }

    // Events
    event PointsAwarded(address indexed user, uint256 points);
    event EthPrizeAwarded(address indexed user, uint256 amount);
    event FundsDeposited(address indexed sender, uint256 amount);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    // Reward distribution
    function distributePrize(
        address user,
        uint256 value,
        PrizeType prizeType
    ) external;

    // Fund management
    function depositFunds() external payable;
    function withdrawFunds(uint256 amount) external;

    // View functions
    function getUserPoints(address user) external view returns (uint256);
    function getUserTotalEthWon(address user) external view returns (uint256);
    function getTotalPointsDistributed() external view returns (uint256);
    function getTotalEthDistributed() external view returns (uint256);
    function getContractBalance() external view returns (uint256);
}
