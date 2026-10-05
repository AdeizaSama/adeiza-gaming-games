import { describe, expect, it } from 'vitest'
import { createRng } from '../rng'
import { defineMachine } from './defineMachine'
import { isFinal, send, start } from './runner'
import type { MachineState } from './types'

// A small machine that exercises every part of the runner. Not a real game.
interface TestContext {
  value: number
  log: string[]
  stampedAt: number | null
}

type TestEvent =
  | { type: 'add'; amount: number }
  | { type: 'addThenDouble' }
  | { type: 'doubleThenAdd' }
  | { type: 'roll' }
  | { type: 'stamp' }
  | { type: 'next' }
  | { type: 'unused' }

const machine = defineMachine<TestContext, TestEvent, { startAt: number }>()({
  initial: 'counting',
  context: ({ input }) => ({ value: input.startAt, log: [], stampedAt: null }),
  phases: {
    counting: {
      interaction: 'prompt_card',
      on: {
        add: { actions: ['addAmount'] },
        addThenDouble: { actions: ['addOne', 'double'] },
        doubleThenAdd: { actions: ['double', 'addOne'] },
        roll: { actions: ['rollDie'] },
        stamp: { actions: ['stampTime'] },
        next: [
          { when: 'isBig', to: 'big' },
          { when: 'isNegative', to: 'negative' },
          { to: 'done' },
        ],
      },
    },
    big: { interaction: 'summary', on: { next: { to: 'done' } } },
    negative: { interaction: 'summary', on: { next: { to: 'done' } } },
    done: { interaction: 'leaderboard', final: true },
  },
  guards: {
    isBig: ({ context }) => context.value >= 100,
    isNegative: ({ context }) => context.value < 0,
  },
  actions: {
    addAmount: ({ context, event }) =>
      event.type === 'add' ? { ...context, value: context.value + event.amount } : context,
    addOne: ({ context }) => ({ ...context, value: context.value + 1, log: [...context.log, 'addOne'] }),
    double: ({ context }) => ({ ...context, value: context.value * 2, log: [...context.log, 'double'] }),
    rollDie: ({ context, rng }) => ({ ...context, value: rng.int(1, 6) }),
    stampTime: ({ context, now }) => ({ ...context, stampedAt: now }),
  },
})

type State = MachineState<TestContext, keyof typeof machine.phases>

function begin(startAt = 0, seed = 1): State {
  return start(machine, { input: { startAt }, seed })
}

const at = { now: 1_000 }

describe('start', () => {
  it('begins in the initial phase with context built from the input', () => {
    const state = begin(5)
    expect(state.phase).toBe('counting')
    expect(state.context).toEqual({ value: 5, log: [], stampedAt: null })
  })

  it('stores the random sequence position', () => {
    expect(begin(0, 42).rngState).toBe(42)
  })
})

describe('send', () => {
  it('runs the actions of a matching transition', () => {
    const state = send(machine, begin(1), { type: 'add', amount: 4 }, at)
    expect(state.context.value).toBe(5)
  })

  it('stays in the same phase when the transition has no `to`', () => {
    expect(send(machine, begin(), { type: 'add', amount: 1 }, at).phase).toBe('counting')
  })

  it('runs actions in the order they are listed', () => {
    expect(send(machine, begin(1), { type: 'addThenDouble' }, at).context.value).toBe(4) // (1 + 1) * 2
    expect(send(machine, begin(1), { type: 'doubleThenAdd' }, at).context.value).toBe(3) // 1 * 2 + 1
  })

  it('picks the first transition whose guard passes', () => {
    expect(send(machine, begin(150), { type: 'next' }, at).phase).toBe('big')
    expect(send(machine, begin(-3), { type: 'next' }, at).phase).toBe('negative')
  })

  it('falls back to the transition without a guard when no guard passes', () => {
    expect(send(machine, begin(10), { type: 'next' }, at).phase).toBe('done')
  })

  it('ignores an event the current phase does not list, returning the same state object', () => {
    const state = begin()
    expect(send(machine, state, { type: 'unused' }, at)).toBe(state)
  })

  it('ignores every event once the game has ended', () => {
    const ended = send(machine, begin(), { type: 'next' }, at)
    expect(ended.phase).toBe('done')
    expect(send(machine, ended, { type: 'add', amount: 1 }, at)).toBe(ended)
  })

  it('passes the time it is given to actions', () => {
    expect(send(machine, begin(), { type: 'stamp' }, { now: 1234 }).context.stampedAt).toBe(1234)
  })

  it('never changes the state it is given', () => {
    const state = begin(1)
    const snapshot = structuredClone(state)
    send(machine, state, { type: 'addThenDouble' }, at)
    send(machine, state, { type: 'roll' }, at)
    expect(state).toEqual(snapshot)
  })
})

describe('randomness', () => {
  it('moves the random sequence forward when an action draws from it', () => {
    const state = begin(0, 7)
    expect(send(machine, state, { type: 'roll' }, at).rngState).not.toBe(state.rngState)
  })

  it('continues one random sequence across events, as if a single Rng made every draw', () => {
    let state = begin(0, 99)
    const rolls: number[] = []
    for (let i = 0; i < 5; i++) {
      state = send(machine, state, { type: 'roll' }, at)
      rolls.push(state.context.value)
    }
    const rng = createRng(99)
    expect(rolls).toEqual(Array.from({ length: 5 }, () => rng.int(1, 6)))
  })

  it('gives the same results for the same seed and events', () => {
    const play = () => {
      let state = begin(0, 99)
      const rolls: number[] = []
      for (let i = 0; i < 5; i++) {
        state = send(machine, state, { type: 'roll' }, at)
        rolls.push(state.context.value)
      }
      return rolls
    }
    expect(play()).toEqual(play())
  })

  it('continues identically after the state is saved and loaded (resume after refresh)', () => {
    let state = begin(0, 3)
    state = send(machine, state, { type: 'roll' }, at)

    const saved = JSON.stringify(state)
    const resumed: State = JSON.parse(saved)

    const withoutRefresh = send(machine, send(machine, state, { type: 'roll' }, at), { type: 'roll' }, at)
    const afterRefresh = send(machine, send(machine, resumed, { type: 'roll' }, at), { type: 'roll' }, at)
    expect(afterRefresh).toEqual(withoutRefresh)
  })
})

describe('isFinal', () => {
  it('is false while playing and true in a final phase', () => {
    const state = begin()
    expect(isFinal(machine, state)).toBe(false)
    expect(isFinal(machine, send(machine, state, { type: 'next' }, at))).toBe(true)
  })
})
