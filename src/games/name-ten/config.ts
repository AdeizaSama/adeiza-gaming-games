import { z } from 'zod'
import { TeamTurnsConfig } from '../../sdk/formats/team-turns/config'

/**
 * Name Ten's settings: the format's (teams, rounds, turn length, packs, tags), plus how many of a category's answers
 * go on the judge's board (ADR 0012). Every category has at least 10 answers, so a board is never short.
 */
export const NameTenConfig = TeamTurnsConfig.extend({
  shown: z.int().min(10).max(15).default(10),
})

export type NameTenConfig = z.output<typeof NameTenConfig>
