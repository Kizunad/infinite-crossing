# 实施指南：Prompt 集成 (Implementation Guide: Prompt Integration)

我们已经创建了 4 个核心 Agent 的生产级 System Prompts，位于 `src/lib/agents/prompts/` 目录下。

## 如何在代码中使用

在构建 Next.js API Route 时，你需要读取这些 Markdown 文件，并将动态数据（如 `world_template`, `player_action`）注入到 Prompt 中。

### 示例代码 (Pseudo-code)

```typescript
import fs from 'fs';
import path from 'path';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

// 1. 读取 System Prompt
const loadPrompt = (agentName: string) => {
  return fs.readFileSync(
    path.join(process.cwd(), `src/lib/agents/prompts/${agentName}.md`),
    'utf-8'
  );
};

// 2. 注入动态上下文 (Context Injection)
const buildJudgeSystemMessage = (worldState: any, hardRules: string) => {
  const basePrompt = loadPrompt('judge');
  return `${basePrompt}\n\n### CURRENT HARD RULES\n${hardRules}`;
};

// 3. 调用 LLM
export async function runTurn(playerAction: string, context: any) {
  // Parallel calls for World & Quest
  const [worldRes, questRes] = await Promise.all([
     // ... call World Agent
     // ... call Quest Agent
  ]);

  // Serial call for Judge
  const judgePrompt = buildJudgeSystemMessage(context.world, context.rules);
  const judgeRes = await generateText({
    model: openai('gpt-4-turbo'),
    system: judgePrompt,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({
          player_action: playerAction,
          world_context: worldRes.object,
          quest_context: questRes.object
        })
      }
    ]
  });

  return judgeRes.object; // Validated JSON
}
```

## 下一步建议

1.  **初始化 Next.js 项目**：使用 `npx create-next-app@latest`。
2.  **配置 Vercel AI SDK**：安装依赖 `npm install ai @ai-sdk/openai zots` (zod-to-ts 用于结构化输出)。
3.  **移植模拟脚本**：将 `tests/acceptance/simulate_turn.py` 的逻辑用 TypeScript 在 `src/lib/game-engine.ts` 中重写。

```