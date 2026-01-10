# 后端开发任务清单 (Backend Tasks)

**定位**：负责 Agent 编排、API 路由、数据清洗与会话状态。
**技术栈**：Next.js API Routes (Node.js Runtime), Vercel AI SDK, Zod.

## 1. 核心引擎实装 (Engine Implementation)
- [x] **LLM 接入 (Live LLM Integration)**
    - 在 `src/lib/game-engine.ts` 中完善 `generateText` 调用。
    - 确保能正确读取 `OPENAI_API_KEY` 等环境变量。
    - **关键**：实现 `System Prompt` 的动态注入（将 `world_template` 和 `rules` 拼接到 Prompt 中）。
- [x] **Agent 并行流 (Agent Orchestration)**
    - 实现 `Promise.all` 并行调用 `World Agent` 和 `Quest Agent`。
    - 实现 `Judge Agent` 的串行等待逻辑。
    - 错误处理：如果 LLM 返回非 JSON 格式，需实现重试机制 (Max Retries: 2)。

## 2. API 路由开发 (API Routes)
- [x] **POST `/api/game/start`**
    - 说明：`world_template_id` 以 `gen_` 开头时，支持两种启动方式：
        1) 前端传入 `generated_world_template`；
        2) 若未传入，则后端从 Supabase 表 `generated_worlds.template_content` 拉取模板（支持书签/分享链接启动）。
    - **输入**：`{ "worldId": "mistwood" }`
    - **逻辑**：
        1. 加载 `docs/WORLD_TEMPLATE_01.md` 内容。
        2. 生成初始的 `PlayerProfile` (HP:100, Power:10)。
        3. 调用 Judge 生成“出生点”的初始旁白。
        4. 生成唯一的 `sessionId` (UUID)。
    - **输出**：返回完整初始状态 JSON。
- [x] **POST `/api/game/turn`**
- [x] **POST `/api/game/atlas`**
    - 说明：支持 `world_id` 为 `gen_` 的生成世界；当请求未携带 `world_template` 时，优先从 Supabase 表 `generated_worlds.template_content` 拉取模板，其次回退到静态模板加载。
    - **输入**：`{ "sessionId": "...", "action": { "type": "choice", "id": "..." } }`
    - **逻辑**：
        1. (MVP阶段) 从内存/数据库读取上一回合的 Context。
        2. 调用 `game-engine.runTurn(...)`。
        3. **数据清洗 (Sanitization)**：**必须**在返回前删除 `hidden_agenda` (Quest), `reasoning` (Judge), `reliability` (Quest) 字段。
    - **输出**：清洗后的 `JudgeVerdict` JSON。

## 3. 安全与工具 (Security & Utils)
- [x] **Prompt 加载器**
    - 编写工具函数，从 `src/lib/agents/prompts/*.md` 读取 Prompt 文件。
- [x] **数据验证层**
    - 使用 `zod` 严格校验前端传入的 `action` 格式，防止注入攻击。

---

## 后端验收标准 (Backend Acceptance Criteria)
1. **协议一致性**：使用 Postman 调用 `/api/game/turn`，返回的 JSON 结构必须严格符合 `docs/DATA_SCHEMA.md`。
2. **秘密保守**：返回给前端的 JSON 中，**绝对不能**包含 `hidden_agenda` 或 `implicit_risk` 字段。
3. **容错性**：当 LLM 超时或报错时，API 应返回 500 错误码及友好的 `error_message`，而不是让服务器崩溃。
