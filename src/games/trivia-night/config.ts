import { choiceConfig, type ChoiceConfig } from '../../sdk/formats/team-turns/choice/config'

/**
 * Trivia Night's settings: the choice turn's (ADR 0015, 0017), with its defaults: one question a 30-second turn,
 * 1 point for a right answer, options shuffled.
 */
export const TriviaConfig = choiceConfig()

export type TriviaConfig = ChoiceConfig
