# Diagram Rendering in Chat

English | [Русский](../docs-ru/DIAGRAM_RENDERING.ru.md) | [中文](../docs-cn/DIAGRAM_RENDERING.cn.md)

**Last updated:** May 2026
**Status:** ✅ Implemented

---

## Overview

LUME supports rendering flowcharts directly in chat messages using the **Mermaid** syntax. When a message starts with a diagram keyword, it is automatically detected and rendered as an SVG diagram.

---

## Backend

### Endpoint

```
POST /api/diagram/render
```

**Request:**
```json
{
  "code": "graph TD; A-->B;",
  "type": "mermaid"
}
```

**Response:**
```json
{
  "svg": "<svg>...</svg>"
}
```

### Features

- **Kroki API Integration** - Uses `https://kroki.io/mermaid/svg` to render diagrams
- **Caching** - Results are cached in Redis by SHA256 hash (TTL: 1 hour)
- **Validation** - Maximum code length: 50,000 characters
- **Error Handling** - Returns 400 for invalid diagram code, 502 for Kroki errors

---

## Frontend

### Auto-Detection

Messages are automatically detected as diagrams when they start with:

- `graph TD` - Top to Bottom flowchart
- `graph BT` - Bottom to Top flowchart
- `graph LR` - Left to Right flowchart
- `graph RL` - Right to Left flowchart
- `flowchart TD` - Top to Bottom (alternative syntax)
- `flowchart BT` - Bottom to Top (alternative syntax)
- `flowchart LR` - Left to Right (alternative syntax)
- `flowchart RL` - Right to Left (alternative syntax)
- `pie` - Pie chart
- `gitGraph` - Git graph

### Component

**File:** `src/components/chat/DiagramMessage.tsx`

**Features:**
- Loading skeleton while rendering
- Error state with message
- SVG rendering with sanitization
- Copy code button (shows checkmark on success)
- Download SVG button (shows checkmark on success)
- Dark theme UI with glass panel effect

---

## Supported Diagram Types

| Type | Keyword | Description |
|------|---------|-------------|
| Flowchart TD | `graph TD` | Top to Bottom |
| Flowchart BT | `graph BT` | Bottom to Top |
| Flowchart LR | `graph LR` | Left to Right |
| Flowchart RL | `graph RL` | Right to Left |
| Flowchart TD (alt) | `flowchart TD` | Alternative syntax |
| Flowchart BT (alt) | `flowchart BT` | Alternative syntax |
| Flowchart LR (alt) | `flowchart LR` | Alternative syntax |
| Flowchart RL (alt) | `flowchart RL` | Alternative syntax |
| Pie Chart | `pie` | Pie chart |
| Git Graph | `gitGraph` | Git commit graph |

---

## Usage Examples

### Simple Flowchart (Top to Bottom)

```
graph TD
A[Start] --> B{Decision}
B -->|Yes| C[Process 1]
B -->|No| D[Process 2]
```

### Flowchart (Left to Right)

```
graph LR
A[Input] --> B[Process]
B --> C[Output]
```

### Complex Flowchart with Subgraphs

```
graph TD
    subgraph Frontend["Frontend (React + TypeScript)"]
        A1[User Interface] --> A2[State Management]
        A2 --> A3[API Client]
    end

    subgraph Backend["Backend (Node.js)"]
        B1[Express] --> B2[Routes]
        B2 --> B3[Database]
    end

    A3 -->|HTTP| B2
```

### Pie Chart

```
pie title Pets
    "Dogs" : 386
    "Cats" : 85
    "Birds" : 15
```

### Git Graph

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

## Integration

### Message Flow

1. User sends message in chat
2. `detectDiagramCode()` checks if message starts with diagram keyword
3. If detected, `DiagramMessage` component renders
4. On mount, component fetches SVG from `/api/diagram/render`
5. SVG is sanitized and displayed
6. Chat automatically scrolls to bottom

### Auto-Scroll

After sending a diagram message, the chat automatically scrolls to show the new content:
- State: `scrollToBottomTrigger` in MessagesPage.tsx
- Triggered after: `handleSendMessage()` completion

---

## Security

- SVG is sanitized before rendering (removes scripts, event handlers)
- Maximum code length enforced (50KB)
- Rate limiting via existing API protection

---

## Files

| File | Description |
|------|-------------|
| `backend/src/routes/diagramRoutes.js` | Backend endpoint |
| `src/components/chat/DiagramMessage.tsx` | React component |
| `src/pages/messages/components/MessageList.tsx` | Integration point |
| `src/pages/messages/MessagesPage.tsx` | Auto-scroll trigger |