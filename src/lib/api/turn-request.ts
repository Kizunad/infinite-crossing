import { z } from 'zod';
import type { PlayerAction } from '@/types/game';

export const PlayerActionSchema = z
  .object({
    type: z.enum(['choice', 'free_text']),
    content: z.string().min(1),
  })
  .strict();

export const LegacyActionSchema = z
  .object({
    type: z.literal('choice'),
    id: z.string().min(1),
  })
  .strict();

export const TurnRequestSchema = z.union([
  z
    .object({
      session_id: z.string().uuid(),
      player_action: PlayerActionSchema,
      known_lore: z.array(z.string()).optional(),
    })
    .strict(),
  z
    .object({
      sessionId: z.string().uuid(),
      action: z.union([PlayerActionSchema, LegacyActionSchema]),
      known_lore: z.array(z.string()).optional(),
    })
    .strict(),
]);

export type TurnRequest = z.infer<typeof TurnRequestSchema>;

export function normalizeTurnRequest(
  data: TurnRequest
): { session_id: string; player_action: PlayerAction; known_lore?: string[] } {
  if ('session_id' in data) return {
    session_id: data.session_id,
    player_action: data.player_action,
    known_lore: data.known_lore
  };

  const action: PlayerAction =
    'content' in data.action
      ? data.action
      : { type: 'choice', content: data.action.id };

  return {
    session_id: data.sessionId,
    player_action: action,
    known_lore: data.known_lore
  };
}

