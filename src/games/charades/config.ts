import { z } from 'zod'
import { TeamTurnsConfig } from '../../sdk/formats/team-turns/config'

/**
 * Charades' settings: the format's (teams, rounds, seconds, packs, tags), plus how cards are clued and what each
 * result is worth (ADR 0007).
 *
 * - `mode`: `describe` plays every card as describe. `mix` gives each card a mode drawn from the item's `modes`,
 *   so a describe-only item is still described.
 * - `points`: what a correct describe, act and sing earn, and what a skip costs. Skip 0 means no penalty.
 */
export const CharadesConfig = TeamTurnsConfig.extend({
  mode: z.enum(['describe', 'mix']).default('describe'),
  // `prefault({})` fills in every point value when `points` is left out; `default` would need all four written.
  points: z
    .strictObject({
      describe: z.int().min(1).max(5).default(2),
      act: z.int().min(1).max(5).default(3),
      sing: z.int().min(1).max(5).default(3),
      skip: z.int().min(0).max(5).default(1),
    })
    .prefault({}),
})

/** Settings after checking, with defaults filled in: what the machine receives. */
export type CharadesConfig = z.output<typeof CharadesConfig>
