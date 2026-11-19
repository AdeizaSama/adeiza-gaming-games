import { choiceConfig, type ChoiceConfig } from '../../sdk/formats/team-turns/choice/config'

/**
 * This or That's settings: the choice turn's (ADR 0017), with its defaults: ten questions a 60-second turn, options
 * A to Z, so both options stay in the same place for every question in a pack.
 */
export const ThisOrThatConfig = choiceConfig({ questions: 10, seconds: 60, order: 'alphabetical' })

export type ThisOrThatConfig = ChoiceConfig
