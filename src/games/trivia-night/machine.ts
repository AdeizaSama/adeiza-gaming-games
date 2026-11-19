import { choiceTurns } from '../../sdk/formats/team-turns/choice/machine'
import type { TriviaItem } from './schema'

/** Trivia Night's machine: the SDK's choice turn (ADR 0015, 0017) on its questions. */
export const machine = choiceTurns<TriviaItem>()
