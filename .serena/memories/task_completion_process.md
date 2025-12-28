# Task Completion Process

When a task is completed, follow these steps:

1. **Linting**: Run `npm run lint` to ensure no new linting errors were introduced.
2. **Type Checking**: Ensure the project builds without TypeScript errors using `npm run build` (or `tsc --noEmit`).
3. **Documentation**: If new features or architectural changes were made, update the corresponding file in `docs/`.
4. **Verification**: 
    - Verify API changes by testing the relevant endpoints in `src/app/api/game/`.
    - Manually verify UI changes in the browser while running `npm run dev`.
    - Check the `tests/` directory for any relevant tests to run.
5. **Onboarding Update**: If the project structure or tech stack changed significantly, update the onboarding memory files using `mcp_serena_write_memory`.
