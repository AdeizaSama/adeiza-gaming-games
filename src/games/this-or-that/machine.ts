import { choiceTurns } from '../../sdk/formats/team-turns/choice/machine'
import type { ThisOrThatItem } from './schema'

/** This or That's machine: the SDK's choice turn (ADR 0017) on its questions. */
export const machine = choiceTurns<ThisOrThatItem>()
