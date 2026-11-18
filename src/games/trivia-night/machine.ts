import { orderOptions } from '../../sdk/content/choices'
import { teamTurns } from '../../sdk/formats/team-turns/teamTurns'
import type { TriviaConfig } from './config'
import type { TriviaItem } from './schema'

/**
 * One turn: the question on screen's options in the order shown, which one the team picked (null while it's open),
 * and whether each question answered this turn was right, in order. The order is kept so a refresh shows the same
 * card, and `results` counts the questions asked so far.
 */
export interface TriviaTurn {
  options: string[]
  picked: number | null
  results: boolean[]
}

/** Sent by the views: the team picks the option at `index`; after the result, the team goes on. */
export type TriviaEvent = { type: 'answer'; index: number } | { type: 'continue' }

/**
 * Trivia Night on the team-turns format (ADR 0004, 0015). The format runs the handoff, timer, question pool, turn
 * summary, scores and results; this is the turn.
 *
 * - When a turn starts, the format draws a question and `dealOptions` puts its options in order.
 * - In the turn, `answer` records the pick and shows the result, in `reveal`. `time_up` ends the turn.
 * - In `reveal`, `continue` draws the next question while the turn has one to come (always, against the clock), or
 *   ends the turn. `time_up` ends it too.
 * - A turn is worth `points` for each right answer.
 */
export const machine = teamTurns<TriviaItem, TriviaTurn, TriviaEvent, TriviaConfig>()({
  newTurn: () => ({ options: [], picked: null, results: [] }),
  points: (turn, config) => turn.results.filter(Boolean).length * config.points,
  onStart: ['dealOptions'],
  phases: {
    turn: {
      interaction: 'multiple_choice',
      on: {
        answer: { when: 'isOption', to: 'reveal', actions: ['pick'] },
        time_up: { to: 'turn_summary' },
      },
    },
    reveal: {
      interaction: 'multiple_choice',
      on: {
        continue: [{ when: 'moreQuestions', to: 'turn', actions: ['drawItem', 'dealOptions'] }, { to: 'turn_summary' }],
        time_up: { to: 'turn_summary' },
      },
    },
  },
  guards: {
    /** True when an `answer` names one of the options. Events come from views, so the index is checked. */
    isOption: ({ context, event }) =>
      event.type === 'answer' && Number.isInteger(event.index) && event.index >= 0 && event.index < context.turn.options.length,
    /** True while the turn has another question to come: always against the clock, else until `questions` are answered. */
    moreQuestions: ({ context }) => context.config.mode === 'clock' || context.turn.results.length < context.config.questions,
  },
  actions: {
    /** Puts the question's options in the order chosen in the settings, with nothing picked. */
    dealOptions: ({ context, rng }) => ({
      ...context,
      turn: { ...context.turn, options: orderOptions(context.item!.options, context.config.order, rng), picked: null },
    }),
    /** Records the option named by `answer`, and whether it was the answer. */
    pick: ({ context, event }) => {
      if (event.type !== 'answer') return context
      const right = context.turn.options[event.index] === context.item!.answer
      return { ...context, turn: { ...context.turn, picked: event.index, results: [...context.turn.results, right] } }
    },
  },
})
