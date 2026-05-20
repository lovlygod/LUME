# LUME E2EE 安全更新

English | [Русский](../docs-ru/E2EE_SECURITY_UPDATES.ru.md) | 中文

**最后更新:** 2026-05-18
**状态:** ✅ 已实现

本文档总结了在保留现有 LUME 架构的同时，向 Signal 风格模型迁移的安全实现工作。

---

## 已完成范围

- Backend 日志清理/清理敏感 payload 字段
- Backend 在 `E2EE_ENFORCE=true` 下的严格纯文本防护
- E2EE 数据库迁移（devices, prekeys, envelopes, replay protection, trust, encrypted attachments metadata）
- 新增/扩展的 E2EE API 路由:
  - 设备注册和 bundle 获取
  - 加密信封发送 + 同步
  - 送达回执
  - 设备信任验证
  - 加密附件 metadata 上传 + 同步
- Frontend E2EE API 客户端方法
- Frontend 功能标志和严格模式支持
- Frontend 消息发送钩子集成（E2EE 优先流程和严格回退行为）
- 迁移存在性和 E2EE 消息流程行为的安全测试

## Backend 变更

### 日志加固

- 敏感密钥在日志输出前被清理
- 验证和错误日志避免泄露消息纯文本或加密 payload

### 纯文本强制执行

当 `E2EE_ENFORCE=true` 时:
- 拒绝纯文本消息体
- 语音/动态体纯文本路径受到约束（在适用处强制执行检查）

### 数据库迁移

- `009_add_e2ee_core_tables.sql`
- `010_add_e2ee_replay_protection.sql`
- `011_add_e2ee_device_trust.sql`
- `012_add_e2ee_encrypted_attachments.sql`

这些引入了 E2EE 中继操作和反重放语义的核心持久化（`client_message_id` 每个发送者设备的唯一性）

## Frontend 变更

### 配置/标志

- `VITE_E2EE_ENABLED`
- `VITE_E2EE_STRICT_MODE`

### E2EE 服务层

添加了信封、设备 bundle、信任操作、回执更新和加密附件 metadata 的客户端方法。

### 消息发送集成

消息发送现在支持:
- 按接收者设备的 E2EE 扇出
- 阻止不安全纯文本回退的严格模式行为
- 禁用严格模式时与传统路径的兼容性回退

## 测试

- 结构和路由级安全检查
- E2EE 发送钩子严格模式行为测试

## 剩余的硬性障碍（实现完整 Signal 等效的预期）

- 完整 Double Ratchet 实现 + 长期状态持久化生命周期
- 生产级设备密钥验证 UX 和信任密钥连续性工作流
- 加密提供程序加固和平台安全存储保证
- 全面的端到端加密互操作性测试矩阵