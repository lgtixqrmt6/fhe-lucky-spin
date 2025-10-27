# FHE Lucky Spin - Test Suite

Comprehensive test suite for the FHE Lucky Spin smart contract.

## 📋 Test Overview

### Unit Tests (`FHELuckySpinV2.test.js`)
Tests individual contract functions and features in isolation:
- Contract deployment and initialization
- Spin functionality and validations
- Prize management
- Access control
- Daily reset mechanism
- Multi-user scenarios

### Integration Tests (`integration.test.js`)
Tests real-world scenarios and contract interactions:
- Multi-player gameplay simulation
- Daily reset behavior
- Withdrawal flow
- Prize statistics
- Edge cases
- Performance testing

## 🚀 Running Tests

### Prerequisites
```bash
cd contracts
npm install
```

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npx hardhat test tests/FHELuckySpinV2.test.js
npx hardhat test tests/integration.test.js
```

### Run with Gas Report
```bash
REPORT_GAS=true npm test
```

### Run with Coverage
```bash
npm run coverage
```

## 📊 Test Coverage

Current test coverage includes:

### ✅ Deployment Tests
- Owner initialization
- Prize configuration
- Daily spin limits

### ✅ Core Functionality
- Spin execution
- Payment validation
- Daily limit enforcement
- Event emissions

### ✅ Prize Management
- Prize information retrieval
- Points tracking
- Prize probabilities

### ✅ Access Control
- Owner-only functions
- Withdrawal permissions
- Security validations

### ✅ Edge Cases
- Insufficient payment
- Overpayment handling
- Daily limit exhaustion
- Time-based resets

### ✅ Multi-User Scenarios
- Independent spin tracking
- Concurrent transactions
- Balance management

## 🎯 Test Scenarios

### Scenario 1: Basic Spin
```javascript
// Player connects wallet
// Player pays 0.01 ETH
// Contract records encrypted result
// Player's spin count increases
```

### Scenario 2: Daily Limit
```javascript
// Player performs 10 spins
// 11th spin attempt fails
// After 24 hours, counter resets
// Player can spin again
```

### Scenario 3: Multi-Player
```javascript
// 5 players spin simultaneously
// Each player tracked independently
// Contract balance accumulates correctly
// No interference between players
```

## 🔍 Test Utilities

### Mock Data
```javascript
const mockHandle = ethers.ZeroHash;
const mockProof = "0x";
const SPIN_COST = ethers.parseEther("0.01");
```

### Time Manipulation
```javascript
// Fast forward 24 hours
await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
await ethers.provider.send("evm_mine");
```

### Balance Checking
```javascript
const balance = await fheLuckySpin.getContractBalance();
const userBalance = await ethers.provider.getBalance(userAddress);
```

## 📈 Expected Results

All tests should pass with:
- ✅ 0 failing tests
- ✅ Gas usage within reasonable limits
- ✅ No reverted transactions (except expected failures)
- ✅ Correct event emissions
- ✅ Accurate balance tracking

## 🐛 Debugging Tests

### Enable Verbose Logging
```bash
DEBUG=true npm test
```

### Check Specific Transaction
```javascript
const tx = await contract.spin(...);
const receipt = await tx.wait();
console.log(receipt);
```

### View Contract State
```javascript
const spinCount = await contract.getUserSpinCount(address);
const remaining = await contract.getRemainingSpins(address);
console.log({ spinCount, remaining });
```

## 🔒 Security Tests

The test suite includes security validations for:
- ✅ Reentrancy protection
- ✅ Access control enforcement
- ✅ Payment validation
- ✅ Integer overflow/underflow
- ✅ Time manipulation resistance

## 📝 Adding New Tests

### Template for New Test
```javascript
describe("New Feature", function () {
  it("Should do something specific", async function () {
    // Arrange
    const mockData = setupMockData();

    // Act
    const result = await contract.newFunction(mockData);

    // Assert
    expect(result).to.equal(expectedValue);
  });
});
```

### Best Practices
1. Use descriptive test names
2. Follow AAA pattern (Arrange, Act, Assert)
3. Test both success and failure cases
4. Clean up state between tests
5. Use meaningful assertion messages

## 🎓 Learning Resources

- [Hardhat Testing Guide](https://hardhat.org/tutorial/testing-contracts)
- [Chai Assertions](https://www.chaijs.com/api/bdd/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Solidity Testing Best Practices](https://docs.soliditylang.org/en/latest/testing.html)
