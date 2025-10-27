# FHE 幸运转盘部署指南

本指南将帮助您完整部署和测试FHE幸运转盘DApp。

## 📋 前置要求

### 1. 环境准备
- Node.js 18+
- MetaMask钱包
- Sepolia测试网ETH（从水龙头获取）
- Infura账户（用于RPC连接）

### 2. 获取测试ETH
访问以下水龙头获取Sepolia测试ETH：
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Faucet](https://sepoliafaucet.com/)

## 🚀 部署步骤

### 步骤1: 安装依赖

```bash
# 安装智能合约依赖
cd contracts
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 步骤2: 配置环境变量

创建 `.env` 文件在 `contracts` 目录下：

```bash
# contracts/.env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
DEPLOYER_PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

创建 `.env.local` 文件在 `frontend` 目录下：

```bash
# frontend/.env.local
VITE_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
VITE_INFURA_API_KEY=your_infura_api_key_here
VITE_ZAMA_GATEWAY_URL=https://api.zama.ai
```

### 步骤3: 编译合约

```bash
cd contracts
npm run compile
```

### 步骤4: 运行测试

```bash
cd contracts
npm test
```

### 步骤5: 部署合约

```bash
cd contracts
npm run deploy:sepolia
```

部署成功后，记录合约地址并更新前端环境变量。

### 步骤6: 验证部署

```bash
cd contracts
CONTRACT_ADDRESS=你的合约地址 npm run test-contract
```

### 步骤7: 启动前端

```bash
cd frontend
npm run dev
```

## 🧪 测试流程

### 1. 基础功能测试

1. **连接钱包**
   - 打开 http://localhost:3000
   - 点击"连接钱包"
   - 确保连接到Sepolia网络

2. **查看合约信息**
   - 验证奖品列表显示正确
   - 检查用户统计信息
   - 确认合约余额和转盘费用

### 2. FHE转盘测试

1. **执行转盘**
   - 点击"开始转盘"按钮
   - 确认支付0.001 ETH费用
   - 等待转盘动画完成

2. **查看结果**
   - 转盘结果应该显示加密状态
   - 中奖后可以领取奖品

3. **领取奖品**
   - 点击"领取奖品"按钮
   - 确认奖品转入钱包

### 3. 边界测试

1. **每日限制测试**
   - 连续转盘3次
   - 验证第4次转盘被拒绝

2. **余额不足测试**
   - 使用余额不足的账户
   - 验证转盘被拒绝

## 🔧 故障排除

### 常见问题

1. **合约部署失败**
   ```
   错误: insufficient funds
   解决: 确保账户有足够的ETH支付Gas费用
   ```

2. **FHE初始化失败**
   ```
   错误: FHE initialization failed
   解决: 检查网络连接和Zama Gateway状态
   ```

3. **转盘失败**
   ```
   错误: InsufficientPayment
   解决: 确保支付足够的转盘费用
   ```

4. **网络错误**
   ```
   错误: wrong network
   解决: 切换到Sepolia网络
   ```

### 调试技巧

1. **查看合约事件**
   ```bash
   # 在Etherscan上查看合约事件
   https://sepolia.etherscan.io/address/你的合约地址#events
   ```

2. **检查Gas费用**
   ```bash
   # 在部署脚本中增加Gas限制
   const tx = await contract.deploy({ gasLimit: 5000000 });
   ```

3. **验证FHE状态**
   ```javascript
   // 在浏览器控制台检查FHE状态
   console.log(window.fhevm);
   ```

## 📊 性能优化

### 1. Gas优化
- 使用适当的Gas价格
- 批量操作减少交易次数
- 优化合约逻辑

### 2. 前端优化
- 使用React.memo减少重渲染
- 实现虚拟滚动处理大量数据
- 添加加载状态提升用户体验

## 🔒 安全注意事项

1. **私钥安全**
   - 永远不要提交私钥到代码库
   - 使用环境变量存储敏感信息
   - 考虑使用硬件钱包

2. **合约安全**
   - 定期进行安全审计
   - 使用OpenZeppelin安全库
   - 实现适当的访问控制

3. **前端安全**
   - 验证所有用户输入
   - 使用HTTPS部署
   - 实现CSP策略

## 📈 监控和维护

### 1. 合约监控
- 监控合约余额
- 跟踪转盘活动
- 记录异常事件

### 2. 用户支持
- 提供清晰的错误信息
- 实现用户反馈机制
- 维护FAQ文档

## 🎯 下一步计划

1. **功能扩展**
   - 添加更多奖品类型
   - 实现VIP用户系统
   - 增加社交功能

2. **技术改进**
   - 优化FHE性能
   - 实现Layer 2支持
   - 添加移动端支持

3. **商业化**
   - 实现代币经济
   - 添加广告系统
   - 建立合作伙伴关系

## 📞 支持

如果您在部署过程中遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查GitHub Issues
3. 联系开发团队

---

**注意**: 这是一个测试版本，仅用于演示FHE技术。在生产环境中使用前，请进行充分的安全审计和测试。
