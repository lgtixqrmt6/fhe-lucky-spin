// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title ISpinManager
 * @notice Interface for managing encrypted spin logic and result calculation
 */
interface ISpinManager {

    // Events
    event SpinExecuted(address indexed user, uint256 spinId, uint256 timestamp, uint256 payment);

    // Spin execution
    function executeSpin(
        address user,
        externalEuint8 encryptedRandom,
        bytes calldata proof
    ) external returns (euint8 result);

    // View functions
    function calculateSpinResult(euint8 randomValue) external returns (euint8);
    function getSpinCost() external pure returns (uint256);
}
