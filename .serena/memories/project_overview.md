# Project Overview: Infinite Reincarnation Web Game (web-game)

## Purpose
An AI-driven "infinite reincarnation" (穿越流) web application where players explore various worlds, face challenges, and carry over knowledge/items across lives. The core mechanic involves a sophisticated "Judge" system to ensure consistency and prevent LLM hallucinations.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), TypeScript, React 19.
- **Styling**: Tailwind CSS 4, ShadcnUI.
- **AI**: Vercel AI SDK (@ai-sdk/google, @ai-sdk/openai).
- **State Management**: Zustand (with persistence/save system).
- **Animation**: Framer Motion.
- **Components**: Radix UI primitives.
- **Validation**: Zod.

## Core Architecture (Three-tier Permissions)
1. **User Space (Intent)**: Player input/intent.
2. **System Space (Validation)**: Judge Agent checks capability and rules.
3. **Kernel Space (Execution)**: Game Engine updates state and renders narrative.

## Key Files & Directories
- `src/app/api/game/`: core API routes (start, turn, settle, atlas, prefetch, sync).
- `src/lib/agents/`: Agent logic, prompt loading, and settlement logic.
- `src/lib/agents/prompts/`: System prompts for different agents (Judge, Narrator, World, Quest, etc.).
- `src/types/game.ts`: Core data structures (TurnContext, JudgeVerdict, PlayerProfile, WorldState).
- `src/store/`: Zustand stores for game state and save system.
- `docs/`: Extensive documentation on system layers, project plan, and tech stack.
