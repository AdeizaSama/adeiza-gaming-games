import { z } from 'zod'
import { OptionOrder } from '../../sdk/content/choices'
import { TeamTurnsConfig } from '../../sdk/formats/team-turns/config'

/**
 * Trivia Night's settings (ADR 0015): the format's (teams, rounds, turn length, packs, tags), plus how a turn plays.
 *
 * - `mode`: `questions` (a set number a turn) or `clock` (as many as the team can answer before time runs out).
 * - `questions`: how many a turn in `questions` mode, 1 to 10. Ignored against the clock.
 * - `points`: for each right answer, 1 to 5. A wrong answer costs nothing.
 * - `order`: the options shuffled each time, or A to Z.
 *
 * The turn is 30 seconds unless set: with one question a turn (the default), that's the time for the question. The
 * limits are the format's own, so only the default changes.
 */
export const TriviaConfig = TeamTurnsConfig.extend({
  seconds: TeamTurnsConfig.shape.seconds.unwrap().default(30),
  mode: z.enum(['questions', 'clock']).default('questions'),
  questions: z.int().min(1).max(10).default(1),
  points: z.int().min(1).max(5).default(1),
  order: OptionOrder.default('shuffle'),
})

export type TriviaConfig = z.output<typeof TriviaConfig>
