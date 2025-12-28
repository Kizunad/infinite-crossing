# 阶段二与阶段三：功能开发计划 (Implementation Plan: Stage 2 & 3)

**当前状态**：核心引擎 `runTurn` 已完成。
**目标**：构建可交互的 Web App 原型，支持从进入世界到死亡结算的完整链路。

---

## 任务 A：后端 API 路由 (Backend API Routes)
**目标**：将 `game-engine` 暴露给前端。

1.  **`POST /api/game/start`**:
    *   接收 `world_id`（默认 `mistwood`）。
    *   初始化 `PlayerProfile` 和 `WorldState`（使用 `docs/WORLD_TEMPLATE_01.md` 的数据）。
    *   返回初始化的 `JudgeVerdict`（包含出生点的旁白描述）。
2.  **`POST /api/game/turn`**:
    *   接收 `session_id`, `player_action` (id 或自由文本)。
    *   调用 `runTurn` 函数。
    *   处理超时与错误（LLM 偶发波动）。

## 任务 B：前端状态机 (Frontend State Management)
**目标**：使用 `Zustand` 管理持久化会话。

1.  **`useGameStore`**:
    *   `history`: 存储每一回合的 `JudgeVerdict`。
    *   `playerStats`: 同步更新生命值、理智、暴露度。
    *   `currentObjectives`: 显示来自 Quest Agent 的任务。
    *   `isProcessing`: 全局 Loading 状态，控制 UI 锁定。

## 任务 C：沉浸式 UI 界面 (Immersive UI Components)
**目标**：实现“指令型交互 + 实时状态感知”。

1.  **`GameTerminal`**:
    *   **叙事展示**：显示 `Narrator` 的文字。支持打字机效果。
    *   **行动选择**：渲染 `Judge` 给出的 3 个按钮。
    *   **自由输入**：底部输入框，允许玩家输入自由指令。
2.  **`SidePanel` (侧栏 Dashboard)**:
    *   **数值可视化**：使用 Progress Bar 显示 HP/SAN/Exposure。
    *   **任务目标**：显示系统发布的（带坑的）任务。
    *   **环境卡片**：显示时间、天气、当前地点。

## 任务 D：死亡与档案馆流程 (Death & Archive Flow)
**目标**：闭环“死亡即封锁”的硬核体验。

1.  **`DeathOverlay`**: 当 `is_death` 为真时弹出，显示 `DeathReport`（死因、避坑指南）。
2.  **`ArchiveSystem`**: 实现简易本地存储，记录已死亡世界的日志。

---

## 验收代码/标准 (Acceptance Criteria)

### 1. API 连通性测试 (API Connectivity)
- [ ] 调用 `/api/game/start` 能返回合法的 JSON 协议。
- [ ] 连续调用 3 次 `/api/game/turn` 不会出现状态丢失。

### 2. UI 交互验证 (UX Flow)
- [ ] 界面应在点击按钮后进入 `isProcessing` 状态，按钮不可重复点击。
- [ ] 侧栏数值变化应有过渡动画。
- [ ] **必杀测试**：在“雾隐镇”触发噪音，UI 必须能展示出 `Exposure` 激增并最终导致 `DeathOverlay` 弹出。

### 3. 数据隔离验证 (Data Isolation)
- [ ] 刷新页面后，当前进度不应丢失（除非未做持久化，MVP 阶段可存入 localStorage）。
- [ ] 确认前端无法查看到 `hidden_agenda` 等裁判私密字段。
