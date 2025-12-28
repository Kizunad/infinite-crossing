# Style and Conventions

## Code Style
- **TypeScript**: Use strict typing. Core types are defined in `src/types/game.ts`.
- **Framework**: Next.js 14 App Router pattern.
- **UI**: Follow ShadcnUI/Radix UI patterns. Use Tailwind CSS for styling.
- **API**: Use Zod for request/response validation. Follow the structured response format (`verdict`, `next_world_state`, etc.).

## Naming Conventions
- **Folders**: Lowercase-kebab-split (e.g., `src/app/api/game`).
- **Components**: PascalCase (e.g., `GameTerminal.tsx`).
- **Variables/Functions**: camelCase.
- **Constants**: UPPER_SNAKE_CASE.

## Architecture Patterns
- **Layered Logic**: Keep AI prompting separate from core engine logic (`src/lib/game-engine.ts`).
- **Prompt Management**: Load prompts from `.md` files in `src/lib/agents/prompts/` using `prompt-loader.ts`.
- **State**: Centralized state management via Zustand in `src/store/`.
