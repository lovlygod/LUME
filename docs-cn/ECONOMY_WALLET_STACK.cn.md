# Economy Wallet 技术栈（Frontend + Backend）

这是新增钱包/economy 子系统的完整版中文技术文档，覆盖后端业务层、前端页面层、实时同步与市场交易逻辑。

## 范围与来源

本文系统化说明：

1. economy 路由/服务/仓储分层架构；
2. 钱包页面数据流与交互流；
3. 转账主链路（校验、幂等、余额变更、审计）；
4. 收款人预检与错误分类；
5. username market 的后端事务与前端交互；
6. WebSocket 实时余额更新；
7. 文案本地化与运维检查点。

主要文件：

- [`economyRoutes.js`](backend/src/routes/economyRoutes.js)
- [`economyService.js`](backend/src/economy/services/economyService.js)
- [`economyRepository.js`](backend/src/economy/repositories/economyRepository.js)
- [`usernameMarketService.js`](backend/src/economy/services/usernameMarketService.js)
- [`usernameMarketRepository.js`](backend/src/economy/repositories/usernameMarketRepository.js)
- [`walletE2eeService.js`](backend/src/economy/services/walletE2eeService.js)
- [`api.ts`](src/services/api.ts)
- [`WalletPage.tsx`](src/pages/wallet/WalletPage.tsx)
- [`WalletMarketPage.tsx`](src/pages/wallet/WalletMarketPage.tsx)
- [`WalletHistoryPage.tsx`](src/pages/wallet/WalletHistoryPage.tsx)
- [`WalletSectionNav.tsx`](src/pages/wallet/WalletSectionNav.tsx)
- [`useWalletData.ts`](src/pages/wallet/useWalletData.ts)
- [`websocket.ts`](src/services/websocket.ts)

## 1）后端分层架构

### Routes 层

[`economyRoutes.js`](backend/src/routes/economyRoutes.js) 负责 HTTP 入口与响应组装，主要能力包括：

- 钱包读取（余额/交易/统计）；
- 转账提交；
- E2EE sync/ack；
- username market（create/list/cancel/buy）；
- 部分经济事件触发 WebSocket 广播。

### Services 层

[`economyService.js`](backend/src/economy/services/economyService.js) 负责业务规则：

- 收款人解析与预检；
- 金额规范化、边界校验、幂等流程；
- 资金转账后的业务后处理；
- 与 E2EE 挂载逻辑协同。

[`usernameMarketService.js`](backend/src/economy/services/usernameMarketService.js) 负责市场业务：

- 价格校验与转换；
- 市场筛选/排序逻辑；
- 挂单创建、取消、购买；
- 审计记录写入。

### Repositories 层

[`economyRepository.js`](backend/src/economy/repositories/economyRepository.js) 负责数据库原子操作：

- 钱包查询/创建；
- 转账事务执行；
- 交易记录查询；
- 幂等键查重；
- 审计事件持久化。

[`usernameMarketRepository.js`](backend/src/economy/repositories/usernameMarketRepository.js) 负责：

- 用户名偏好、展示顺序；
- 市场挂单查询；
- 购买时资金与用户名所有权的同事务转移。

## 2）前端架构与页面职责

### API 契约层

经济模块接口定义在 [`api.ts`](src/services/api.ts)，核心方法包括：

- [`api.economy.transfer()`](src/services/api.ts:341)
- [`api.economy.getWalletE2EESync()`](src/services/api.ts:347)
- [`api.economy.ackWalletE2EEEnvelope()`](src/services/api.ts:354)
- market 的 create/cancel/buy/list 相关调用

### 页面层

- [`WalletPage`](src/pages/wallet/WalletPage.tsx)：钱包首页、发送弹窗、预检、实时更新。
- [`WalletMarketPage`](src/pages/wallet/WalletMarketPage.tsx)：用户名市场列表、挂单、买入、撤单。
- [`WalletHistoryPage`](src/pages/wallet/WalletHistoryPage.tsx)：历史记录独立页。

### 导航层

钱包内导航由 [`WalletSectionNav`](src/pages/wallet/WalletSectionNav.tsx:6) 提供，应用级路由在 [`App.tsx`](src/App.tsx) 注册。

## 3）转账主链路

1. 前端在 [`WalletPage`](src/pages/wallet/WalletPage.tsx) 触发提交，调用 [`api.economy.transfer()`](src/services/api.ts:341)。
2. 后端通过 [`resolveRecipientWallet()`](backend/src/economy/services/economyService.js:15) 解析地址或用户名。
3. [`transferCoin()`](backend/src/economy/services/economyService.js:104) 执行校验、幂等、额度与费用逻辑。
4. [`executeTransfer()`](backend/src/economy/repositories/economyRepository.js:205) 在数据库事务内完成余额变更。
5. 提交后写审计，并在路由层向双方推送 `economy:wallet_updated`。
6. 若带有 `encrypted` 字段，继续挂载 E2EE 元数据。

## 4）收款人预检与错误反馈

后端逻辑：[`previewRecipient()`](backend/src/economy/services/economyService.js:26)。

前端表现（[`WalletPage`](src/pages/wallet/WalletPage.tsx)）：

- blur 阶段提前校验；
- 显示接收方头像/用户名；
- 区分错误类型（用户名不存在 / 地址不存在）；
- 发送成功后重置表单，失败时保留上下文。

## 5）WebSocket 实时余额同步

服务端在 [`economyRoutes.js`](backend/src/routes/economyRoutes.js:94) 推送钱包更新事件。

客户端通过 [`WebSocketService`](src/services/websocket.ts:17) 订阅，钱包页在 [`WalletPage`](src/pages/wallet/WalletPage.tsx:200) 监听后触发 reload，确保：

- 主余额实时刷新；
- 交易活动流及时更新；
- 多端操作状态趋于一致。

## 6）Username Market 业务闭环

### 后端闭环

- 创建挂单；
- 查询挂单；
- 取消挂单；
- 购买挂单；
- 审计与广播。

关键事务函数：[`buyListing()`](backend/src/economy/repositories/usernameMarketRepository.js:366)。

其核心保证：

1. 资金变更与用户名 ownership 变更同事务提交；
2. 幂等与并发保护降低重复成交风险；
3. 写审计并触发前端更新信号。

### 前端闭环

[`WalletMarketPage`](src/pages/wallet/WalletMarketPage.tsx) 包含：

1. 市场列表和筛选排序；
2. 挂单创建；
3. 我的挂单管理；
4. 购买确认弹窗；
5. 错误解析与用户提示。

## 7）格式化与通用工具

- 金额展示：[`formatCoin()`](src/pages/wallet/format.ts:1)
- 手续费估算：[`estimateFeeMicro()`](src/pages/wallet/format.ts:12)
- 头像/URL 归一化：
  - [`normalizeImageUrl()`](src/lib/utils.ts:14)
  - [`getUserAvatar()`](src/lib/utils.ts:34)

## 8）本地化结构

经济模块文案主要位于：

- [`en.json`](src/i18n/locales/en.json)
- [`ru.json`](src/i18n/locales/ru.json)

常用命名空间：

- `economy.wallet.*`
- `economy.market.*`
- `economy.history.*`

## 9）正确性与安全控制

1. 幂等键防止重复财务变更。
2. 数据库事务避免部分写入。
3. 频率限制降低滥用风险。
4. 审计日志保证可追溯性。
5. E2EE replay 防护补充加密元数据侧安全。

## 10）运维检查清单

1. 确认 economy/E2EE 迁移已完整执行。
2. 验证重复幂等键请求行为正确。
3. 验证收款人预检与错误分类准确。
4. 验证 `economy:wallet_updated` 可驱动前端刷新。
5. 验证 market create/cancel/buy 的广播与审计链路。

## 11）模块耦合点与变更注意

1. transfer 流程耦合 economy 与 wallet E2EE。
2. market buy 流程耦合余额系统与用户名 ownership。
3. wallet UI 依赖 HTTP 拉取 + WS 事件双通路。

若调整 balances、ledger、usernames 或 envelope 结构，必须同步更新 repository/service/API/UI 四层。

