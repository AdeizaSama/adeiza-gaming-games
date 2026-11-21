import { z } from 'zod'
import { TeamTurnsConfig } from '../../sdk/formats/team-turns/config'

/** The three ways to play Pairs (ADR 0020). */
export const PairsPlay = z.enum(['flip', 'match', 'odd'])
export type PairsPlay = z.infer<typeof PairsPlay>

/**
 * Pairs' settings (ADR 0020): the format's (teams, rounds, turn length, packs, tags, and Free Play's), plus:
 *
 * - `play`: flip cards, match-up, or odd-one-out.
 * - `twoWay`: either side can be shown first. True for a pack of word pairs; false for a pack of words and groups.
 * - `cards`: how many cards (flip) or sets of ten tiles (match, odd) a turn, 1 to 50. The turn ends after them, or
 *   when time runs out.
 */
export const PairsConfig = TeamTurnsConfig.extend({
  play: PairsPlay.default('flip'),
  twoWay: z.boolean().default(true),
  cards: z.int().min(1).max(50).default(10),
})

export type PairsConfig = z.output<typeof PairsConfig>
