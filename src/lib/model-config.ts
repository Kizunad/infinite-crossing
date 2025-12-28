/**
 * Multi-Model Configuration Module
 *
 * Provides utility functions to get the appropriate AI model for each agent type.
 * Supports per-agent model configuration via environment variables.
 */

export type AgentType = 'judge' | 'world' | 'quest' | 'narrator' | 'archivist' | 'compressor' | 'generator' | 'envstate';

const DEFAULT_MODEL = 'gemini-2.0-flash';

/**
 * Returns the model ID for the specified agent type.
 *
 * Resolution order:
 * 1. `LLM_MODEL_<AGENT_NAME>` (e.g., `LLM_MODEL_JUDGE`)
 * 2. `LLM_MODEL` (general fallback)
 * 3. Hardcoded default (`gemini-2.5-flash`)
 *
 * @param agentType - The type of agent requesting a model.
 * @returns The model ID string.
 */
export function getModelForAgent(agentType: AgentType): string {
    const envKey = `LLM_MODEL_${agentType.toUpperCase()}`;
    const specificModel = process.env[envKey];

    if (specificModel) {
        return specificModel;
    }

    return process.env.LLM_MODEL || DEFAULT_MODEL;
}

/**
 * Logs which model is being used for a given agent.
 * Useful for debugging multi-model configurations.
 *
 * @param agentType - The type of agent.
 */
export function logModelUsage(agentType: AgentType): void {
    const modelId = getModelForAgent(agentType);
    console.log(`[ModelConfig] Agent '${agentType}' using model: ${modelId}`);
}
