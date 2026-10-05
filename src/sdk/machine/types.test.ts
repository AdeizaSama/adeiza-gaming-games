import { describe, expect, it } from 'vitest'
import { createRng } from '../rng'
import type { MachineDefinition } from './types'

// A tiny dice game, only for testing the types: roll until the score reaches the target.
interface DiceContext {
  score: number
  target: number
}

type DiceEvent = { type: 'roll' } | { type: 'reset' }

type DiceMachine = MachineDefinition<
  DiceContext,
  DiceEvent,
  { target: number },
  'playing' | 'done',
  'reachedTarget',
  'rollDie' | 'resetScore'
>

const dice: DiceMachine = {
  initial: 'playing',
  context: ({ input }) => ({ score: 0, target: input.target }),
  phases: {
    playing: {
      interaction: 'prompt_card',
      on: {
        roll: [
          { when: 'reachedTarget', to: 'done' },
          { actions: ['rollDie'] },
        ],
        reset: { actions: ['resetScore'] },
      },
    },
    done: { interaction: 'leaderboard', final: true },
  },
  guards: {
    reachedTarget: ({ context }) => context.score >= context.target,
  },
  actions: {
    rollDie: ({ context, rng }) => ({ ...context, score: context.score + rng.int(1, 6) }),
    resetScore: ({ context }) => ({ ...context, score: 0 }),
  },
}

describe('machine types', () => {
  it('describe a machine whose context, guards and actions work together', () => {
    const context = dice.context({ input: { target: 10 }, rng: createRng(1) })
    const rolled = dice.actions.rollDie({ context, event: { type: 'roll' }, rng: createRng(1), now: 0 })

    expect(rolled.score).toBeGreaterThanOrEqual(1)
    expect(rolled.score).toBeLessThanOrEqual(6)
    expect(context.score).toBe(0) // the action returned a new context instead of changing the old one
    expect(dice.guards.reachedTarget({ context: { score: 10, target: 10 }, event: { type: 'roll' } })).toBe(true)
  })
})

// Mistakes the types must reject. Each line below `@ts-expect-error` has to be a type error;
// if one stops being an error, `pnpm typecheck` fails with "Unused '@ts-expect-error' directive".
export const mistakes: DiceMachine[] = [
  {
    ...dice,
    // @ts-expect-error: the initial phase must be one of the machine's phases
    initial: 'start',
  },
  {
    ...dice,
    phases: {
      ...dice.phases,
      playing: {
        interaction: 'prompt_card',
        // @ts-expect-error: 'jump' is not one of the game's events
        on: { jump: { to: 'done' } },
      },
    },
  },
  {
    ...dice,
    phases: {
      ...dice.phases,
      // @ts-expect-error: 'finished' is not a phase (typo for 'done')
      playing: { interaction: 'prompt_card', on: { roll: { to: 'finished' } } },
    },
  },
  {
    ...dice,
    phases: {
      ...dice.phases,
      // @ts-expect-error: 'rolDie' is not an action (typo for 'rollDie')
      playing: { interaction: 'prompt_card', on: { roll: { actions: ['rolDie'] } } },
    },
  },
  {
    ...dice,
    phases: {
      ...dice.phases,
      // @ts-expect-error: 'reachTarget' is not a guard (typo for 'reachedTarget')
      playing: { interaction: 'prompt_card', on: { roll: { when: 'reachTarget', to: 'done' } } },
    },
  },
  {
    ...dice,
    // @ts-expect-error: every guard that's named must be implemented
    guards: {},
  },
  {
    ...dice,
    actions: {
      ...dice.actions,
      // @ts-expect-error: an action must return the whole context, not just part of it
      resetScore: () => ({ score: 0 }),
    },
  },
]
