# 后端开发任务清单 (Backend Tasks)

**定位**：负责 Agent 编排、API 路由、数据清洗与会话状态。
**技术栈**：Next.js API Routes (Node.js Runtime), Vercel AI SDK, Zod.

## 1. 核心引擎实装 (Engine Implementation)
- [ ] **LLM 接入 (Live LLM Integration)**
    - 在 `src/lib/game-engine.ts` 中完善 `generateText` 调用。
    - 确保能正确读取 `OPENAI_API_KEY` 等环境变量。
    - **关键**：实现 `System Prompt` 的动态注入（将 `world_template` 和 `rules` 拼接到 Prompt 中）。
- [ ] **Agent 并行流 (Agent Orchestration)**
    - 实现 `Promise.all` 并行调用 `World Agent` 和 `Quest Agent`。
    - 实现 `Judge Agent` 的串行等待逻辑。
    - 错误处理：如果 LLM 返回非 JSON 格式，需实现重试机制 (Max Retries: 2)。

## 2. API 路由开发 (API Routes)
- [ ] **POST `/api/game/start`**
    - **输入**：`{ "worldId": "mistwood" }`
    - **逻辑**：
        1. 加载 `docs/WORLD_TEMPLATE_01.md` 内容。
        2. 生成初始的 `PlayerProfile` (HP:100, SAN:80)。
        3. 调用 Judge 生成“出生点”的初始旁白。
        4. 生成唯一的 `sessionId` (UUID)。
    - **输出**：返回完整初始状态 JSON。
- [ ] **POST `/api/game/turn`**
    - **输入**：`{ "sessionId": "...", "action": { "type": "choice", "id": "..." } }`
    - **逻辑**：
        1. (MVP阶段) 从内存/数据库读取上一回合的 Context。
        2. 调用 `game-engine.runTurn(...)`。
        3. **数据清洗 (Sanitization)**：**必须**在返回前删除 `hidden_agenda` (Quest), `reasoning` (Judge), `reliability` (Quest) 字段。
    - **输出**：清洗后的 `JudgeVerdict` JSON。

## 3. 安全与工具 (Security & Utils)
- [ ] **Prompt 加载器**
    - 编写工具函数，从 `src/lib/agents/prompts/*.md` 读取 Prompt 文件。
- [ ] **数据验证层**
    - 使用 `zod` 严格校验前端传入的 `action` 格式，防止注入攻击。

---

## 后端验收标准 (Backend Acceptance Criteria)
1. **协议一致性**：使用 Postman 调用 `/api/game/turn`，返回的 JSON 结构必须严格符合 `docs/DATA_SCHEMA.md`。
2. **秘密保守**：返回给前端的 JSON 中，**绝对不能**包含 `hidden_agenda` 或 `implicit_risk` 字段。
3. **容错性**：当 LLM 超时或报错时，API 应返回 500 错误码及友好的 `error_message`，而不是让服务器崩溃。
