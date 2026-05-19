# 聊天中的图表渲染

[English](../docs/DIAGRAM_RENDERING.md) | [Русский](../docs-ru/DIAGRAM_RENDERING.ru.md) | **中文**

**最后更新:** 2026年5月
**状态:** ✅ 已实现

---

## 概述

LUME 支持使用 **Mermaid** 语法直接在聊天消息中渲染流程图。当消息以图表关键字开头时，它会自动检测并渲染为 SVG 图表。

---

## 后端

### 端点

```
POST /api/diagram/render
```

**请求:**
```json
{
  "code": "graph TD; A-->B;",
  "type": "mermaid"
}
```

**响应:**
```json
{
  "svg": "<svg>...</svg>"
}
```

### 特性

- **Kroki API 集成** - 使用 `https://kroki.io/mermaid/svg` 渲染图表
- **缓存** - 结果在 Redis 中按 SHA256 哈希缓存（TTL: 1小时）
- **验证** - 最大代码长度: 50,000 字符
- **错误处理** - 无效图表代码返回 400，Kroki 错误返回 502

---

## 前端

### 自动检测

当消息以下列关键字开头时，会自动检测为图表：

- `graph TD` - 从上到下流程图
- `graph BT` - 从下到上流程图
- `graph LR` - 从左到右流程图
- `graph RL` - 从右到左流程图
- `flowchart TD` - 替代语法（从上到下）
- `flowchart BT` - 替代语法（从下到上）
- `flowchart LR` - 替代语法（从左到右）
- `flowchart RL` - 替代语法（从右到左）
- `pie` - 饼图
- `gitGraph` - Git 图表

### 组件

**文件:** `src/components/chat/DiagramMessage.tsx`

**特性:**
- 渲染时的加载骨架
- 带消息的错误状态
- 带清理的 SVG 渲染
- 复制代码按钮（成功时显示勾号）
- 下载 SVG 按钮（成功时显示勾号）
- 深色主题 UI，带玻璃面板效果

---

## 支持的图表类型

| 类型 | 关键字 | 描述 |
|------|--------|------|
| 流程图 TD | `graph TD` | 从上到下 |
| 流程图 BT | `graph BT` | 从下到上 |
| 流程图 LR | `graph LR` | 从左到右 |
| 流程图 RL | `graph RL` | 从右到左 |
| 流程图 TD（别名） | `flowchart TD` | 替代语法 |
| 流程图 BT（别名） | `flowchart BT` | 替代语法 |
| 流程图 LR（别名） | `flowchart LR` | 替代语法 |
| 流程图 RL（别名） | `flowchart RL` | 替代语法 |
| 饼图 | `pie` | 饼图 |
| Git 图表 | `gitGraph` | Git 提交图 |

---

## 使用示例

### 简单流程图（从上到下）

```
graph TD
A[开始] --> B{决策}
B -->|是| C[流程 1]
B -->|否| D[流程 2]
```

### 流程图（从左到右）

```
graph LR
A[输入] --> B[处理]
B --> C[输出]
```

### 复杂流程图

```
graph TD
    subgraph Frontend["前端 (React + TypeScript)"]
        A1[用户界面] --> A2[状态管理]
        A2 --> A3[API 客户端]
    end

    subgraph Backend["后端 (Node.js)"]
        B1[Express] --> B2[路由]
        B2 --> B3[数据库]
    end

    A3 -->|HTTP| B2
```

### 饼图

```
pie title 宠物统计
    "狗" : 386
    "猫" : 85
    "鸟" : 15
```

### Git 图表

```
gitGraph
    commit id: "1"
    commit id: "2"
    branch feature
    commit id: "3"
    checkout main
    commit id: "4"
```

---

## 集成

### 消息流程

1. 用户在聊天中发送消息
2. `detectDiagramCode()` 检查消息是否以图表关键字开头
3. 如果检测到，则渲染 `DiagramMessage` 组件
4. 挂载时，组件从 `/api/diagram/render` 获取 SVG
5. SVG 被清理并显示
6. 聊天自动滚动到底部

### 自动滚动

发送图表消息后，聊天会自动滚动以显示新内容：
- 状态: `scrollToBottomTrigger` 在 MessagesPage.tsx
- 触发: `handleSendMessage()` 完成后

---

## 安全

- SVG 在渲染前被清理（删除脚本、事件处理程序）
- 强制执行最大代码长度（50KB）
- 通过现有 API 保护进行速率限制

---

## 文件

| 文件 | 描述 |
|------|------|
| `backend/src/routes/diagramRoutes.js` | 后端端点 |
| `src/components/chat/DiagramMessage.tsx` | React 组件 |
| `src/pages/messages/components/MessageList.tsx` | 集成点 |
| `src/pages/messages/MessagesPage.tsx` | 自动滚动触发器 |