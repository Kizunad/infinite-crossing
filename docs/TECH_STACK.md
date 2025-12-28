# 技术栈规范 (Tech Stack Specification)

为了实现《无限穿越流》Web App，我们采用以下技术栈，兼顾开发效率与 AI 交互的灵活性。

## 1. 前端 (Frontend)
- **框架**: **Next.js 14+ (App Router)**
    - *理由*：React 生态最强，适合构建复杂的交互界面（Chat + Sidebar + Archive）。
- **语言**: **TypeScript**
    - *理由*：严格的类型安全对于处理复杂的 World/Player 状态至关重要。
- **UI 组件库**: **ShadcnUI + Tailwind CSS**
    - *理由*：ShadcnUI 提供了高质量、可定制的组件（如 Dialog, Sidebar, ScrollArea），且风格现代、极简，非常符合“档案馆”的美学。
- **状态管理**: **Zustand**
    - *理由*：轻量级，适合管理前端的临时状态（对话流、当前回合数据）。
- **动画**: **Framer Motion**
    - *理由*：用于打字机效果、侧栏展开/收起、页面转场，增强沉浸感。

## 2. 后端与 AI (Backend & AI)
鉴于系统包含复杂的 Agent 编排（Judge, World, Quest, Narrator），我们建议使用 **Next.js API Routes** 配合 **Vercel AI SDK** 进行轻量级编排。如果逻辑过于复杂，后期可拆分为 Python (FastAPI) 微服务。

**初期方案 (MVP)**：
- **Runtime**: **Node.js** (Next.js API Routes)
- **AI SDK**: **Vercel AI SDK (Core)**
    - 提供了标准的 `generateText`, `streamText` 接口，易于切换模型（OpenAI, Anthropic, Google）。
- **Prompt 管理**: 代码中通过 Template 字符串或独立 `.ts` 文件管理 Prompts。

## 3. 数据存储 (Persistence)
- **数据库**: **PostgreSQL** (通过 Supabase 或 Vercel Postgres)
    - *理由*：关系型数据库适合存储结构化的 `PlayerProfile`, `WorldHistory`, `DeathRecords`。
- **ORM**: **Drizzle ORM** 或 **Prisma**
    - *理由*：Drizzle 更轻量，生成的 SQL 更可控。

## 4. 目录结构规范 (Directory Structure)

```
/src
  /app              # Next.js App Router 页面
  /components       # UI 组件
    /game           # 游戏专用组件 (GameTerminal, SidePanel, StatCard)
    /ui             # 通用 UI (Button, Input)
  /lib              # 工具函数
    /agents         # AI Agent 定义 (world-agent.ts, judge-agent.ts...)
    /rules          # 规则常量 (judge-rules.ts)
  /db               # 数据库 Schema
  /types            # TypeScript 类型定义
```

## 5. 开发工具 (Dev Tools)
- **包管理器**: `pnpm`
- **Linting**: `ESLint` + `Prettier`

---

**特别说明**：
虽然是 Web App，但核心逻辑在于 **Agent Loop**。
在 MVP 阶段，可以将 Agent Loop 实现为一个无状态的 API：
`POST /api/turn`
Input: `PlayerAction`, `CurrentHistory`
Output: `NewWorldState`, `Narrative`, `Options`
前端负责维护 History，直到 Session 结束存入数据库。
