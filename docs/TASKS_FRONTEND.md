# 前端开发任务清单 (Frontend Tasks)

**定位**：负责界面渲染、动画交互、状态管理 (Zustand)。
**技术栈**：Next.js (React Server/Client Components), ShadcnUI, Tailwind, Framer Motion.

## 1. 基础设施建设 (Infrastructure)
- [x] **组件库安装**
    - 安装 ShadcnUI 基础组件：`Button`, `Card`, `Progress`, `ScrollArea`, `Skeleton`, `Dialog`.
    - 配置 `lucide-react` 图标库。
- [x] **状态管理 (Store)**
    - 基于 `src/lib/store-blueprint.ts` 实现 `src/store/game.ts`。
    - 确保 `history` 数组能够持久化（使用 Zustand `persist` 中间件），防止刷新丢失进度。

## 2. 核心组件开发 (Core Components)
- [x] **`src/components/game/GameTerminal.tsx` (主交互区)**
    - **打字机组件**：接收 `string`，以 30ms/char 的速度逐字显示。需支持“点击立即跳过”。
    - **历史记录流**：使用 `ScrollArea` 展示之前的回合记录（样式需区分“过去”与“现在”）。
    - **输入控制**：在打字机效果未结束前，锁定底部操作栏。
- [x] **`src/components/game/ActionPanel.tsx` (操作栏)**
    - **动态按钮**：根据 API 返回的 `options` 渲染 3 个按钮。
    - **风险提示**：如果 Option 带有 `risk_level: critical`，按钮边框应有红色呼吸效果。
    - **自由输入框**：允许玩家输入文本，回车提交。
- [x] **`src/components/game/SidePanel.tsx` (侧栏)**
    - **数值面板**：展示 HP (红), Power (蓝/紫)。
    - **任务卡片**：展示 `currentObjectives`。
    - **环境信息**：展示当前时间、天气图标。

## 3. 特殊交互 (Special Interactions)
- [x] **死亡蒙版 (DeathOverlay)**
    - 全屏覆盖层（黑色半透明）。
    - 只有当 Store 中 `isDead: true` 时触发。
    - 展示 `DeathReport` 内容，并提供“进入档案馆（重开）”按钮。
- [x] **加载状态**
    - 在 API 请求期间（`isProcessing: true`），输入区应显示“系统推演中...”的 Loading 动画（如闪烁的光标或旋转的 Loading Spinner）。

---

## 前端验收标准 (Frontend Acceptance Criteria)
1. **零逻辑原则**：前端代码中不得包含任何“如果 HP < 0 则死亡”的判断逻辑，一切以 API 返回的 `is_death` 字段为准。
2. **状态同步**：点击“行动”后，侧栏的 HP/Power 条应在接收到响应后平滑过渡更新。
3. **防止连击**：在 `isProcessing` 为 `true` 期间，所有交互按钮必须处于 Disabled 状态。
