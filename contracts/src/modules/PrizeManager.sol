// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IPrizeManager} from "../interfaces/IPrizeManager.sol";

/**
 * @title PrizeManager
 * @notice Manages prize configuration and probability distribution for the lucky spin game
 */
contract PrizeManager is IPrizeManager, Ownable {

    // State variables
    Prize[] private prizes;
    uint256 private totalProbability;

    // Authorization
    mapping(address => bool) public authorized;

    // Errors
    error Unauthorized();
    error InvalidPrizeId();
    error InvalidProbability();
    error ProbabilityOverflow();

    // Modifiers
    modifier onlyAuthorized() {
        if (!authorized[msg.sender] && msg.sender != owner()) {
            revert Unauthorized();
        }
        _;
    }

    constructor() Ownable(msg.sender) {
        // Initialize default prizes
        _addPrize("Thank You", 0, PrizeType.POINTS, 40);       // 40% chance
        _addPrize("100 Points", 100, PrizeType.POINTS, 30);    // 30% chance
        _addPrize("500 Points", 500, PrizeType.POINTS, 20);    // 20% chance
        _addPrize("0.1 ETH", 0.1 ether, PrizeType.ETH, 8);     // 8% chance
        _addPrize("0.5 ETH", 0.5 ether, PrizeType.ETH, 2);     // 2% chance
    }

    /**
     * @notice Set authorization for a contract
     * @param account Address to authorize
     * @param status Authorization status
     */
    function setAuthorization(address account, bool status) external onlyOwner {
        authorized[account] = status;
    }

    /**
     * @notice Add a new prize
     * @param name Prize name
     * @param value Prize value (points or wei)
     * @param prizeType Type of prize (POINTS or ETH)
     * @param probability Winning probability (0-100)
     */
    function addPrize(
        string calldata name,
        uint256 value,
        PrizeType prizeType,
        uint8 probability
    ) external override onlyOwner {
        _addPrize(name, value, prizeType, probability);
    }

    /**
     * @notice Update an existing prize
     * @param prizeId ID of the prize to update
     * @param name New prize name
     * @param value New prize value
     * @param prizeType New prize type
     * @param probability New probability
     */
    function updatePrize(
        uint256 prizeId,
        string calldata name,
        uint256 value,
        PrizeType prizeType,
        uint8 probability
    ) external override onlyOwner {
        if (prizeId >= prizes.length) {
            revert InvalidPrizeId();
        }

        if (probability > 100) {
            revert InvalidProbability();
        }

        // Recalculate total probability
        uint256 newTotal = totalProbability - prizes[prizeId].probability + probability;
        if (newTotal > 100) {
            revert ProbabilityOverflow();
        }

        totalProbability = newTotal;

        prizes[prizeId] = Prize({
            name: name,
            value: value,
            prizeType: prizeType,
            probability: probability,
            active: true
        });

        emit PrizeUpdated(prizeId, name, value, prizeType, probability);
    }

    /**
     * @notice Set prize active status
     * @param prizeId ID of the prize
     * @param active New active status
     */
    function setPrizeActive(uint256 prizeId, bool active) external override onlyOwner {
        if (prizeId >= prizes.length) {
            revert InvalidPrizeId();
        }
        prizes[prizeId].active = active;
        emit PrizeStatusChanged(prizeId, active);
    }

    /**
     * @notice Get prize information
     * @param prizeId ID of the prize
     * @return Prize details
     */
    function getPrize(uint256 prizeId) external view override returns (Prize memory) {
        if (prizeId >= prizes.length) {
            revert InvalidPrizeId();
        }
        return prizes[prizeId];
    }

    /**
     * @notice Get total number of prizes
     * @return Number of prizes
     */
    function getPrizeCount() external view override returns (uint256) {
        return prizes.length;
    }

    /**
     * @notice Get total probability sum
     * @return Total probability
     */
    function getTotalProbability() external view override returns (uint256) {
        return totalProbability;
    }

    /**
     * @notice Check if prize is active
     * @param prizeId ID of the prize
     * @return True if active
     */
    function isPrizeActive(uint256 prizeId) external view override returns (bool) {
        if (prizeId >= prizes.length) {
            return false;
        }
        return prizes[prizeId].active;
    }

    /**
     * @dev Internal function to add a prize
     */
    function _addPrize(
        string memory name,
        uint256 value,
        PrizeType prizeType,
        uint8 probability
    ) internal {
        if (probability > 100) {
            revert InvalidProbability();
        }

        uint256 newTotal = totalProbability + probability;
        if (newTotal > 100) {
            revert ProbabilityOverflow();
        }

        totalProbability = newTotal;

        prizes.push(Prize({
            name: name,
            value: value,
            prizeType: prizeType,
            probability: probability,
            active: true
        }));

        emit PrizeAdded(prizes.length - 1, name, value, prizeType, probability);
    }
}
