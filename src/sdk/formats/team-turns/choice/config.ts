import { z } from 'zod'
import { OptionOrder } from '../../../content/choices'
import { TeamTurnsConfig } from '../config'

/** How a turn plays: a set number of questions, or as many as the team can answer before time runs out. */
export const ChoiceMode = z.enum(['questions', 'clock'])

/** A game's own defaults for the choice settings. Anything left out takes the value in `choiceConfig`. */
export interface ChoiceDefaults {
  seconds?: number
  mode?: z.infer<typeof ChoiceMode>
  questions?: number
  points?: number
  order?: OptionOrder
}

/**
 * The settings of a multiple-choice game (ADR 0015, 0017): the format's (teams, rounds, turn length, packs, tags),
 * plus how a turn plays, with the game's own defaults.
 *
 * - `mode`: `questions` (a set number a turn) or `clock` (as many as the team can answer before time runs out).
 * - `questions`: how many a turn in `questions` mode, 1 to 50. Ignored against the clock.
 * - `points`: for each right answer, 1 to 5. A wrong answer costs nothing.
 * - `order`: the options shuffled each time, or A to Z.
 * - `seconds`: the format's turn length, with its limits; only the default changes.
 *
 * Without defaults: one question a 30-second turn, 1 point, shuffled. Trivia Night:
 *
 *   export const TriviaConfig = choiceConfig()
 */
export function choiceConfig(defaults: ChoiceDefaults = {}) {
  // safeExtend: it replaces a field of the format's (seconds), which plain extend refuses on a schema with a rule
  // across settings (ADR 0019). The rule is kept.
  return TeamTurnsConfig.safeExtend({
    seconds: TeamTurnsConfig.shape.seconds.unwrap().default(defaults.seconds ?? 30),
    mode: ChoiceMode.default(defaults.mode ?? 'questions'),
    // Up to 50: a Free Play game is one turn of up to 50 questions (ADR 0019). Competitive setup offers 1 to 10 a turn.
    questions: z.int().min(1).max(50).default(defaults.questions ?? 1),
    points: z.int().min(1).max(5).default(defaults.points ?? 1),
    order: OptionOrder.default(defaults.order ?? 'shuffle'),
  })
}

/** Settings after checking: what the machine receives. The same shape for every game; only the defaults differ. */
export type ChoiceConfig = z.output<ReturnType<typeof choiceConfig>>
