import { describe, expect, expectTypeOf, it } from 'vitest'
import { defineMachine } from './defineMachine'

// The same dice game as types.test.ts, written the way game authors will: no name lists.
interface DiceContext {
  score: number
  target: number
}

type DiceEvent = { type: 'roll' } | { type: 'reset' }

const defineDice = defineMachine<DiceContext, DiceEvent, { target: number }>()

const dice = defineDice({
  initial: 'playing',
  context: ({ input }) => ({ score: 0, target: input.target }),
  phases: {
    playing: {
      interaction: 'prompt_card',
      on: {
        roll: [{ when: 'reachedTarget', to: 'done' }, { actions: ['rollDie'] }],
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
})

describe('defineMachine', () => {
  it('returns the definition unchanged', () => {
    const definition = {
      initial: 'only',
      context: () => ({ score: 0, target: 1 }),
      phases: { only: { interaction: 'summary', final: true } },
      guards: {},
      actions: {},
    } as const
    expect(defineDice(definition)).toBe(definition)
  })

  // Checked by `pnpm typecheck`; at runtime these lines do nothing.
  it('works out the phase, guard and action names from the definition', () => {
    expectTypeOf<keyof typeof dice.phases>().toEqualTypeOf<'playing' | 'done'>()
    expectTypeOf<keyof typeof dice.guards>().toEqualTypeOf<'reachedTarget'>()
    expectTypeOf<keyof typeof dice.actions>().toEqualTypeOf<'rollDie' | 'resetScore'>()
  })
})

// Mistakes that must be type errors on the line with the mistake (see types.test.ts for how this works).
// With defineMachine, names come only from the keys of phases, guards and actions, so a name that is used but
// not defined (a typo, or a guard that was never written) is reported where it's used.
export const mistakes = [
  defineDice({
    ...dice,
    // @ts-expect-error: 'start' is not a phase
    initial: 'start',
  }),
  defineDice({
    ...dice,
    phases: {
      ...dice.phases,
      // @ts-expect-error: 'finished' is not a phase (typo for 'done')
      playing: { interaction: 'prompt_card', on: { roll: { to: 'finished' } } },
    },
  }),
  defineDice({
    ...dice,
    phases: {
      ...dice.phases,
      // @ts-expect-error: 'rolDie' is not an action (typo for 'rollDie')
      playing: { interaction: 'prompt_card', on: { roll: { actions: ['rolDie'] } } },
    },
  }),
  // Written out in full: spreading `dice` here would carry its 'reachedTarget' guard name along with it.
  defineDice({
    initial: 'playing',
    context: ({ input }) => ({ score: 0, target: input.target }),
    phases: {
      // @ts-expect-error: 'reachedTarget' is used but no such guard is defined
      playing: { interaction: 'prompt_card', on: { roll: { when: 'reachedTarget', to: 'done' } } },
      done: { interaction: 'leaderboard', final: true },
    },
    guards: {},
    actions: {},
  }),
  defineDice({
    ...dice,
    phases: {
      ...dice.phases,
      playing: {
        interaction: 'prompt_card',
        // @ts-expect-error: 'jump' is not one of the game's events
        on: { jump: { to: 'done' } },
      },
    },
  }),
  defineDice({
    ...dice,
    actions: {
      ...dice.actions,
      // @ts-expect-error: an action must return the whole context
      resetScore: () => ({ score: 0 }),
    },
  }),
  defineDice({
    ...dice,
    phases: {
      ...dice.phases,
      // @ts-expect-error: a final phase ends the game, so it can't respond to events
      done: { interaction: 'leaderboard', final: true, on: { reset: { to: 'playing' } } },
    },
  }),
]
