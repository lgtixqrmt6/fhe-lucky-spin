// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IPrizeManager
 * @notice Interface for managing prize configuration and probability distribution
 */
interface IPrizeManager {

    enum PrizeType {
        POINTS,
        ETH
    }

    struct Prize {
        string name;
        uint256 value;
        PrizeType prizeType;
        uint8 probability;
        bool active;
    }

    // Events
    event PrizeAdded(uint256 indexed prizeId, string name, uint256 value, PrizeType prizeType, uint8 probability);
    event PrizeUpdated(uint256 indexed prizeId, string name, uint256 value, PrizeType prizeType, uint8 probability);
    event PrizeStatusChanged(uint256 indexed prizeId, bool active);

    // Prize management
    function addPrize(string calldata name, uint256 value, PrizeType prizeType, uint8 probability) external;
    function updatePrize(uint256 prizeId, string calldata name, uint256 value, PrizeType prizeType, uint8 probability) external;
    function setPrizeActive(uint256 prizeId, bool active) external;

    // View functions
    function getPrize(uint256 prizeId) external view returns (Prize memory);
    function getPrizeCount() external view returns (uint256);
    function getTotalProbability() external view returns (uint256);
    function isPrizeActive(uint256 prizeId) external view returns (bool);
}
