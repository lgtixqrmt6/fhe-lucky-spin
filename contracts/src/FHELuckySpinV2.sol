// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint8, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IPrizeManager} from "./interfaces/IPrizeManager.sol";
import {ISpinManager} from "./interfaces/ISpinManager.sol";
import {IUserRecords} from "./interfaces/IUserRecords.sol";
import {IRewardDistributor} from "./interfaces/IRewardDistributor.sol";

/**
 * @title FHELuckySpinV2
 * @notice Main orchestration contract for privacy-preserving lucky spin game
 * @dev Coordinates between modular components: PrizeManager, SpinManager, UserRecords, RewardDistributor
 */
contract FHELuckySpinV2 is SepoliaConfig, Ownable, ReentrancyGuard {

    // Module references
    IPrizeManager public prizeManager;
    ISpinManager public spinManager;
    IUserRecords public userRecords;
    IRewardDistributor public rewardDistributor;

    // Events
    event SpinExecuted(address indexed user, uint256 spinId, uint256 timestamp);
    event PrizeClaimed(address indexed user, uint256 spinId, string prizeName, uint256 prizeValue);
    event DecryptionRequested(address indexed user, uint256 spinId, uint256 requestId);
    event DecryptionCompleted(address indexed user, uint256 spinId, uint256 requestId, uint8 result);

    // Errors
    error InsufficientPayment();
    error DailyLimitExceeded();
    error AlreadyClaimed();
    error InvalidDecryption();
    error InvalidSpinId();
    error DecryptionNotRequested();
    error DecryptionAlreadyCompleted();
    error InvalidDecryptionResult();

    // Decryption request tracking
    struct DecryptionRequest {
        address user;
        uint256 spinId;
        uint256 timestamp;
        bool completed;
        uint8 result;
    }
    
    mapping(uint256 => DecryptionRequest) public decryptionRequests;
    mapping(address => mapping(uint256 => uint256)) public userDecryptionRequests; // user => spinId => requestId
    uint256 public nextRequestId = 1;

    /**
     * @notice Constructor
     * @param _prizeManager Address of PrizeManager contract
     * @param _spinManager Address of SpinManager contract
     * @param _userRecords Address of UserRecords contract
     * @param _rewardDistributor Address of RewardDistributor contract
     */
    constructor(
        address _prizeManager,
        address _spinManager,
        address _userRecords,
        address _rewardDistributor
    ) Ownable(msg.sender) {
        prizeManager = IPrizeManager(_prizeManager);
        spinManager = ISpinManager(_spinManager);
        userRecords = IUserRecords(_userRecords);
        rewardDistributor = IRewardDistributor(_rewardDistributor);
    }

    /**
     * @notice Execute a spin
     * @param encryptedRandom Encrypted random number from user
     * @param proof Proof for the encrypted random number
     */
    function spin(externalEuint8 encryptedRandom, bytes calldata proof)
        external
        payable
        nonReentrant
    {
        // Check payment
        uint256 spinCost = spinManager.getSpinCost();
        if (msg.value != spinCost) {
            revert InsufficientPayment();
        }

        // Check daily limit
        if (!userRecords.checkDailyLimit(msg.sender)) {
            revert DailyLimitExceeded();
        }

        // Execute spin and get encrypted result
        euint8 result = spinManager.executeSpin(msg.sender, encryptedRandom, proof);

        // Allow user to decrypt result
        FHE.allow(result, msg.sender);

        // Record spin
        uint256 spinId = userRecords.recordSpin(msg.sender, result);

        // Increment daily count
        userRecords.incrementDailyCount(msg.sender);

        // Forward payment to reward distributor
        (bool success, ) = address(rewardDistributor).call{value: msg.value}("");
        require(success, "Payment forward failed");

        emit SpinExecuted(msg.sender, spinId, block.timestamp);
    }

    /**
     * @notice Claim prize after Gateway decryption verification
     * @param spinId ID of the spin record
     */
    function claimPrize(uint256 spinId) external nonReentrant {
        // Get spin record
        IUserRecords.SpinRecord memory record = userRecords.getSpinRecord(msg.sender, spinId);

        // Check if already claimed
        if (record.claimed) {
            revert AlreadyClaimed();
        }

        // Check if decryption was requested and completed
        uint256 requestId = userDecryptionRequests[msg.sender][spinId];
        if (requestId == 0) {
            revert DecryptionNotRequested();
        }

        DecryptionRequest memory decryptionRequest = decryptionRequests[requestId];
        if (!decryptionRequest.completed) {
            revert DecryptionNotRequested();
        }

        // Get decrypted result from Gateway
        uint8 decryptedResult = decryptionRequest.result;
        
        // Validate result is within prize range
        if (decryptedResult >= prizeManager.getPrizeCount()) {
            revert InvalidDecryptionResult();
        }

        // Get prize information
        IPrizeManager.Prize memory prize = prizeManager.getPrize(decryptedResult);

        // Update spin record
        userRecords.updateSpinClaim(
            msg.sender,
            spinId,
            prize.value,
            IUserRecords.PrizeType(uint8(prize.prizeType)),
            prize.name
        );

        // Distribute prize if value > 0
        if (prize.value > 0) {
            rewardDistributor.distributePrize(
                msg.sender,
                prize.value,
                IRewardDistributor.PrizeType(uint8(prize.prizeType))
            );
        }

        emit PrizeClaimed(msg.sender, spinId, prize.name, prize.value);
    }

    /**
     * @notice Get remaining spins for user today
     * @param user Address of the user
     * @return Number of remaining spins
     */
    function getRemainingSpins(address user) external view returns (uint256) {
        return userRecords.getRemainingSpins(user);
    }

    /**
     * @notice Get user spin count
     * @param user Address of the user
     * @return Total number of spins
     */
    function getUserSpinCount(address user) external view returns (uint256) {
        return userRecords.getUserSpinCount(user);
    }

    /**
     * @notice Get user points balance
     * @param user Address of the user
     * @return Points balance
     */
    function getUserPoints(address user) external view returns (uint256) {
        return rewardDistributor.getUserPoints(user);
    }

    /**
     * @notice Get user total ETH won
     * @param user Address of the user
     * @return Total ETH won
     */
    function getUserTotalEthWon(address user) external view returns (uint256) {
        return rewardDistributor.getUserTotalEthWon(user);
    }

    /**
     * @notice Get spin record details
     * @param user Address of the user
     * @param spinId ID of the spin
     * @return Spin record
     */
    function getSpinRecord(address user, uint256 spinId)
        external
        view
        returns (IUserRecords.SpinRecord memory)
    {
        return userRecords.getSpinRecord(user, spinId);
    }

    /**
     * @notice Get prize information
     * @param prizeId ID of the prize
     * @return Prize details
     */
    function getPrize(uint256 prizeId) external view returns (IPrizeManager.Prize memory) {
        return prizeManager.getPrize(prizeId);
    }

    /**
     * @notice Get prize count
     * @return Number of prizes
     */
    function getPrizeCount() external view returns (uint256) {
        return prizeManager.getPrizeCount();
    }

    /**
     * @notice Get contract balance
     * @return Balance in wei
     */
    function getContractBalance() external view returns (uint256) {
        return rewardDistributor.getContractBalance();
    }

    /**
     * @notice Get global statistics
     * @return totalPointsDistributed Total points distributed
     * @return totalEthDistributed Total ETH distributed
     * @return contractBalance Current contract balance
     * @return spinCost Cost per spin
     */
    function getGlobalStats()
        external
        view
        returns (
            uint256 totalPointsDistributed,
            uint256 totalEthDistributed,
            uint256 contractBalance,
            uint256 spinCost
        )
    {
        return (
            rewardDistributor.getTotalPointsDistributed(),
            rewardDistributor.getTotalEthDistributed(),
            rewardDistributor.getContractBalance(),
            spinManager.getSpinCost()
        );
    }

    /**
     * @notice Get user spin history with prize details
     * @param user Address of the user
     * @return timestamps Array of spin timestamps
     * @return prizeNames Array of prize names
     * @return prizeValues Array of prize values
     * @return claimed Array of claim status
     */
    function getUserSpinHistory(address user)
        external
        view
        returns (
            uint256[] memory timestamps,
            string[] memory prizeNames,
            uint256[] memory prizeValues,
            bool[] memory claimed
        )
    {
        uint256 count = userRecords.getUserSpinCount(user);
        timestamps = new uint256[](count);
        prizeNames = new string[](count);
        prizeValues = new uint256[](count);
        claimed = new bool[](count);

        for (uint256 i = 0; i < count; i++) {
            IUserRecords.SpinRecord memory record = userRecords.getSpinRecord(user, i);
            timestamps[i] = record.timestamp;
            prizeNames[i] = record.prizeName;
            prizeValues[i] = record.prizeValue;
            claimed[i] = record.claimed;
        }

        return (timestamps, prizeNames, prizeValues, claimed);
    }

    /**
     * @notice Deposit funds to reward distributor
     */
    function depositFunds() external payable {
        (bool success, ) = address(rewardDistributor).call{value: msg.value}("");
        require(success, "Deposit failed");
    }

    /**
     * @notice Withdraw funds from reward distributor (owner only)
     * @param amount Amount to withdraw
     */
    function withdrawFunds(uint256 amount) external onlyOwner {
        rewardDistributor.withdrawFunds(amount);
    }

    /**
     * @notice Add prize (owner only)
     * @param name Prize name
     * @param value Prize value
     * @param prizeType Type of prize
     * @param probability Winning probability
     */
    function addPrize(
        string calldata name,
        uint256 value,
        IPrizeManager.PrizeType prizeType,
        uint8 probability
    ) external onlyOwner {
        prizeManager.addPrize(name, value, prizeType, probability);
    }

    /**
     * @notice Update prize (owner only)
     * @param prizeId ID of the prize
     * @param name New prize name
     * @param value New prize value
     * @param prizeType New prize type
     * @param probability New probability
     */
    function updatePrize(
        uint256 prizeId,
        string calldata name,
        uint256 value,
        IPrizeManager.PrizeType prizeType,
        uint8 probability
    ) external onlyOwner {
        prizeManager.updatePrize(prizeId, name, value, prizeType, probability);
    }

    /**
     * @notice Set prize active status (owner only)
     * @param prizeId ID of the prize
     * @param active New active status
     */
    function setPrizeActive(uint256 prizeId, bool active) external onlyOwner {
        prizeManager.setPrizeActive(prizeId, active);
    }

    /**
     * @notice Request decryption of spin result (simplified version)
     * @param spinId ID of the spin record
     * @return requestId Decryption request ID
     */
    function requestSpinResultDecryption(uint256 spinId) external returns (uint256) {
        // Check if decryption already requested
        if (userDecryptionRequests[msg.sender][spinId] != 0) {
            revert DecryptionAlreadyCompleted();
        }

        // Create decryption request
        uint256 requestId = nextRequestId++;
        decryptionRequests[requestId] = DecryptionRequest({
            user: msg.sender,
            spinId: spinId,
            timestamp: block.timestamp,
            completed: false,
            result: 0
        });
        
        userDecryptionRequests[msg.sender][spinId] = requestId;

        // Note: In a real implementation, this would call Gateway
        // For now, we'll simulate the decryption process
        // In production, this should be replaced with actual Gateway integration

        emit DecryptionRequested(msg.sender, spinId, requestId);
        return requestId;
    }

    /**
     * @notice Simulate decryption completion (for testing)
     * @param requestId Decryption request ID
     * @param result Decrypted result
     */
    function simulateDecryption(uint256 requestId, uint8 result) external onlyOwner {
        // Find matching decryption request
        DecryptionRequest storage decryptionRequest = decryptionRequests[requestId];
        require(decryptionRequest.user != address(0), "Invalid request ID");
        require(!decryptionRequest.completed, "Decryption already completed");
        
        // Update decryption request
        decryptionRequest.completed = true;
        decryptionRequest.result = result;
        
        emit DecryptionCompleted(
            decryptionRequest.user, 
            decryptionRequest.spinId, 
            requestId, 
            result
        );
    }

    /**
     * @notice Get decryption request status
     * @param user Address of the user
     * @param spinId ID of the spin
     * @return requestId Decryption request ID
     * @return completed Whether decryption is completed
     * @return result Decrypted result (if completed)
     */
    function getDecryptionStatus(address user, uint256 spinId) 
        external 
        view 
        returns (uint256 requestId, bool completed, uint8 result) 
    {
        requestId = userDecryptionRequests[user][spinId];
        if (requestId == 0) {
            return (0, false, 0);
        }
        
        DecryptionRequest memory decryptionRequest = decryptionRequests[requestId];
        return (requestId, decryptionRequest.completed, decryptionRequest.result);
    }

    /**
     * @notice Verify spin result fairness (for transparency)
     * @param user Address of the user
     * @param spinId ID of the spin
     * @param userRandom User's original random number
     * @return isValid Whether the result is valid
     * @return expectedResult Expected result based on user random
     * @return actualResult Actual decrypted result
     */
    function verifySpinResult(
        address user, 
        uint256 spinId, 
        uint8 userRandom
    ) external view returns (bool isValid, uint8 expectedResult, uint8 actualResult) {
        // Get decryption status
        (uint256 requestId, bool completed, uint8 result) = this.getDecryptionStatus(user, spinId);
        
        if (!completed) {
            return (false, 0, 0);
        }
        
        actualResult = result;
        
        // Simulate the same spin calculation logic
        // This should match the logic in SpinManager.calculateSpinResult
        uint8 normalizedRandom = userRandom % 100;
        uint256 prizeCount = prizeManager.getPrizeCount();
        uint8 cumulativeProbability = 0;
        
        for (uint256 i = 0; i < prizeCount; i++) {
            IPrizeManager.Prize memory prize = prizeManager.getPrize(i);
            if (prize.active) {
                cumulativeProbability += prize.probability;
                if (normalizedRandom < cumulativeProbability) {
                    expectedResult = uint8(i);
                    break;
                }
            }
        }
        
        isValid = (expectedResult == actualResult);
        return (isValid, expectedResult, actualResult);
    }

    /**
     * @notice Get spin fairness proof (for transparency)
     * @param user Address of the user
     * @param spinId ID of the spin
     * @return userRandom User's original random number (if available)
     * @return normalizedRandom Normalized random (0-99)
     * @return prizeProbabilities Array of prize probabilities
     * @return decryptionRequestId Gateway decryption request ID
     */
    function getSpinFairnessProof(address user, uint256 spinId) 
        external 
        view 
        returns (
            uint8 userRandom,
            uint8 normalizedRandom,
            uint8[] memory prizeProbabilities,
            uint256 decryptionRequestId
        ) 
    {
        // Note: In a real implementation, we would need to store the user's original random
        // For now, we return placeholder values
        userRandom = 0; // Would need to be stored during spin
        normalizedRandom = 0;
        
        uint256 prizeCount = prizeManager.getPrizeCount();
        prizeProbabilities = new uint8[](prizeCount);
        
        for (uint256 i = 0; i < prizeCount; i++) {
            IPrizeManager.Prize memory prize = prizeManager.getPrize(i);
            prizeProbabilities[i] = prize.probability;
        }
        
        decryptionRequestId = userDecryptionRequests[user][spinId];
    }
}
