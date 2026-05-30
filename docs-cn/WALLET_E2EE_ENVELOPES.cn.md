# 钱包转账 E2EE 信封机制

这是钱包转账加密信封子系统的完整技术文档（中文版）。

## 范围与来源

本文覆盖从前端构建 `encrypted` 负载、后端写入与防重放、到收件端同步与 ack 的全链路。

核心文件：

- [`018_wallet_e2ee.sql`](backend/database/migrations/018_wallet_e2ee.sql)
- [`walletE2eeRepository.js`](backend/src/economy/repositories/walletE2eeRepository.js)
- [`walletE2eeService.js`](backend/src/economy/services/walletE2eeService.js)
- [`walletE2ee.ts`](src/services/walletE2ee.ts)
- [`transferCoin()`](backend/src/economy/services/economyService.js:104)
- [`api.economy.transfer()`](src/services/api.ts:341)
- [`api.economy.getWalletE2EESync()`](src/services/api.ts:347)
- [`api.economy.ackWalletE2EEEnvelope()`](src/services/api.ts:354)
- [`/economy/coin/e2ee/sync`](backend/src/routes/economyRoutes.js:115)
- [`/economy/coin/e2ee/envelopes/:id/ack`](backend/src/routes/economyRoutes.js:125)

## 目标

在后端不解密业务明文的前提下，安全地存储并分发转账加密元数据（ciphertext + 按设备 fan-out 的 envelopes）。

系统保证：

1. 严格校验 `encrypted` 结构。
2. 通过 nonce 预留机制阻断 replay。
3. 持久化保存加密消息和设备信封。
4. 基于 `afterId` 的游标同步。
5. 通过 `delivered` / `decrypted` 维护状态机。

## 架构说明

### Backend 分层

- 路由入口：[`economyRoutes.js`](backend/src/routes/economyRoutes.js)
- 业务逻辑：[`walletE2eeService.js`](backend/src/economy/services/walletE2eeService.js)
- 数据访问：[`walletE2eeRepository.js`](backend/src/economy/repositories/walletE2eeRepository.js)
- 转账挂载点：[`economyService.js`](backend/src/economy/services/economyService.js)

### Frontend 分层

- 负载构建：[`buildWalletEncryptedPayload()`](src/services/walletE2ee.ts:17)
- API 调用：[`api.ts`](src/services/api.ts)

## 数据模型（Migration 018）

迁移 [`018_wallet_e2ee.sql`](backend/database/migrations/018_wallet_e2ee.sql) 引入三类核心数据。

### 1）Replay nonce 预留

入口：[`reserveReplayNonce()`](backend/src/economy/repositories/walletE2eeRepository.js:5)

用于避免同一 `(actor, device, operation, nonce)` 被重复写入。

### 2）加密消息主记录

入口：[`createWalletEncryptedMessage()`](backend/src/economy/repositories/walletE2eeRepository.js:16)

保存与转账记录绑定的加密元信息（ciphertext、aad、发送者设备信息等）。

### 3）按设备 envelope 扇出

入口：[`createWalletEncryptedEnvelopes()`](backend/src/economy/repositories/walletE2eeRepository.js:53)

每个接收设备一行，包含设备定向密钥材料与 ack 状态字段。

## 端到端流程

### 步骤 1：客户端构建 payload

客户端调用 [`buildWalletEncryptedPayload()`](src/services/walletE2ee.ts:17)，将结果放入 [`api.economy.transfer()`](src/services/api.ts:341) 的 `encrypted` 字段。

### 步骤 2：金融转账先执行

[`transferCoin()`](backend/src/economy/services/economyService.js:104) 先执行资金侧逻辑与提交。

### 步骤 3：挂载 E2EE 数据

转账成功后，调用 [`attachEncryptedTransfer()`](backend/src/economy/services/walletE2eeService.js:38)。

### 步骤 4：结构校验

[`validateEncryptedTransferPayload()`](backend/src/economy/services/walletE2eeService.js:4) 校验：

- `senderDeviceId`
- `clientOperationId`
- `nonceB64`
- ciphertext/metadata
- 非空 `envelopes`

### 步骤 5：Replay 防护

[`reserveReplayNonce()`](backend/src/economy/repositories/walletE2eeRepository.js:5) 预留唯一 nonce，冲突即拒绝。

### 步骤 6：写入消息 + 信封

- 消息：[`createWalletEncryptedMessage()`](backend/src/economy/repositories/walletE2eeRepository.js:16)
- 信封：[`createWalletEncryptedEnvelopes()`](backend/src/economy/repositories/walletE2eeRepository.js:53)

### 步骤 7：收件端同步

客户端调用 [`api.economy.getWalletE2EESync()`](src/services/api.ts:347)，后端由 [`syncEncryptedWalletEnvelopes()`](backend/src/economy/services/walletE2eeService.js:76) 返回增量数据。

### 步骤 8：回执确认

客户端调用 [`api.economy.ackWalletE2EEEnvelope()`](src/services/api.ts:354)，后端由 [`ackWalletEnvelope()`](backend/src/economy/services/walletE2eeService.js:99) 更新状态：

- [`markWalletEnvelopeDelivered()`](backend/src/economy/repositories/walletE2eeRepository.js:95)
- [`markWalletEnvelopeDecrypted()`](backend/src/economy/repositories/walletE2eeRepository.js:108)

## API 合约

### Transfer（带 encrypted）

前端：[`api.economy.transfer()`](src/services/api.ts:341)

核心字段：`to`、`amount_coin`、`idempotency_key`、`encrypted`。

### Sync

路由实现：[`economyRoutes.js`](backend/src/routes/economyRoutes.js:115)

参数：`deviceId`（必填）、`afterId`（可选）、`limit`（可选）。

### Ack

路由实现：[`economyRoutes.js`](backend/src/routes/economyRoutes.js:125)

状态：`delivered`、`decrypted`。

## 错误与校验

常见错误类别：

1. `encrypted` 结构不合法。
2. `envelopes` 为空。
3. nonce replay 冲突。
4. 非法 user/device 的 ack 请求。

## 安全属性

1. 后端不解密钱包密文。
2. replay 防护与转账 idempotency 相互独立。
3. ack 严格绑定用户与设备，避免跨设备污染。
4. 游标同步支持断点续传，降低漏包/重包风险。

## Idempotency 与 Replay 的区别

- idempotency：防止财务重复记账。
- replay reservation：防止加密元数据重复写入。

二者缺一不可。

## 运维建议

### 发送端

1. 每次操作生成新 nonce。
2. retry 场景复用稳定 `clientOperationId`。
3. 按收件设备完整生成 envelopes。

### 接收端

1. 使用 `afterId` 持续增量同步。
2. 先本地落盘，再发送 ack。
3. 解密成功后再上报 `decrypted`。

### 服务端

1. 监控 replay 冲突频率。
2. 监控 envelope backlog。
3. 变更 payload 时保持前后端版本协同。

## 测试建议

至少覆盖：

1. 有效 encrypted 转账写入 message/envelopes。
2. 同 `(deviceId, operationId, nonce)` 重放被拒绝。
3. `afterId` 分页返回单调递增数据。
4. 仅合法 user/device 可 ack。
5. 无 `encrypted` 时普通转账正常。

## 已知限制

1. 该模块当前主要依赖 pull sync（无独立 envelope WS 流）。
2. payload 协议升级需前后端同步发布。
3. 收件设备越多，fan-out 行数线性增长。

## 版本演进建议

调整 payload 结构时：

1. 在 [`validateEncryptedTransferPayload()`](backend/src/economy/services/walletE2eeService.js:4) 增加向后兼容解析。
2. 在迁移窗口保留旧版本读取逻辑。
3. 在 AAD/metadata 中维护显式版本标记。


