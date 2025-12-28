import type { QuestOutput } from '@/types/game';

/**
 * Sanitize quest state before sending to client.
 * Removes: hidden_agenda, reliability from intel_logs.
 */
export function sanitizeQuestState(quest: QuestOutput) {
  return {
    visible_objectives: quest.visible_objectives,
    // Strip reliability field - client shouldn't know how trustworthy intel is
    intel_logs: quest.intel_logs.map(log => ({
      source: log.source,
      content: log.content,
    })),
    // hidden_agenda is intentionally NOT included
  };
}