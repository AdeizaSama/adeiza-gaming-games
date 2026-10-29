import { describe, expect, expectTypeOf, it } from 'vitest'
import { isFinal, send, start } from '../../machine/runner'
import type { MachineState } from '../../machine/types'
import { validateMachine } from '../../machine/validateMachine'
import type { TeamTurnsConfig } from './config'
import type { TeamTurnsContext } from './rules'
import { teamTurns, type TeamTurnsEvent } from './teamTurns'

// Word Duel: a test game for the format, never registered as a real game. A team sees a word and guesses it (`got`,
// one point) or passes (`skip`) until time runs out. The SDK can't import a real game (lint forbids sdk/ → games/),
// so the format is tested with this one.

interface WordTurn {
  got: string[]
  skipped: string[]
}

type WordEvent = { type: 'got' } | { type: 'skip' }

const defineWordDuel = teamTurns<string, WordTurn, WordEvent>()

const wordDuel = defineWordDuel({
  newTurn: () => ({ got: [], skipped: [] }),
  points: (turn) => turn.got.length,
  phases: {
    turn: {
      interaction: 'flash_card',
      on: {
        got: { actions: ['markGot', 'drawItem'] },
        skip: { actions: ['markSkipped', 'drawItem'] },
        time_up: { to: 'turn_summary' },
      },
    },
  },
  guards: {},
  actions: {
    markGot: ({ context }) => ({ ...context, turn: { ...context.turn, got: [...context.turn.got, context.item!] } }),
    markSkipped: ({ context }) => ({
      ...context,
      turn: { ...context.turn, skipped: [...context.turn.skipped, context.item!] },
    }),
  },
})

type WordState = MachineState<TeamTurnsContext<string, WordTurn>, keyof typeof wordDuel.phases>
type AnyEvent = WordEvent | TeamTurnsEvent

const config: TeamTurnsConfig = { teams: ['Lions', 'Eagles'], rounds: 2, seconds: 30, packs: ['test'], tags: [] }
const input = { config, items: ['sun', 'moon', 'star', 'rain', 'wind'] }

/** Plays one turn from the handoff: start, got, skip, got, time up, next. */
function playTurn(state: WordState, now: number): WordState {
  const events: AnyEvent[] = [
    { type: 'start' },
    { type: 'got' },
    { type: 'skip' },
    { type: 'got' },
    { type: 'time_up' },
    { type: 'next' },
  ]
  return events.reduce((current, event) => send(wordDuel, current, event, { now }), state)
}

/** Plays turns until the game ends, one a minute after `now`, recording the state after each turn. */
function playToEnd(first: WordState, now = 0): WordState[] {
  const states = [first]
  while (!isFinal(wordDuel, states[states.length - 1])) {
    now += 60_000
    states.push(playTurn(states[states.length - 1], now))
    if (states.length > 100) throw new Error('The game never ended')
  }
  return states
}

describe('teamTurns: Word Duel, a full game', () => {
  it('has no mistakes validateMachine can find', () => {
    expect(validateMachine(wordDuel)).toEqual([])
  })

  it('adds the format’s phases, guards and actions to the game’s', () => {
    expect(Object.keys(wordDuel.phases).sort()).toEqual(['handoff', 'results', 'turn', 'turn_summary'])
    expect(Object.keys(wordDuel.guards)).toEqual(['turnsRemaining'])
    expect(Object.keys(wordDuel.actions).sort()).toEqual([
      'advanceTeam',
      'bankPoints',
      'drawItem',
      'markGot',
      'markSkipped',
      'startTurn',
    ])
    expect(wordDuel.initial).toBe('handoff')
  })

  it('starts at the first team’s handoff with scores at zero and the items shuffled', () => {
    const state = start(wordDuel, { input, seed: 1 })
    expect(state.phase).toBe('handoff')
    expect(state.context).toMatchObject({ scores: [0, 0], current: 0, round: 1, item: null, turnEndsAt: null })
    expect([...state.context.pool.remaining].sort()).toEqual(['moon', 'rain', 'star', 'sun', 'wind'])
  })

  it('refuses to start with no items', () => {
    expect(() => start(wordDuel, { input: { config, items: [] }, seed: 1 })).toThrow('at least one item')
  })

  it('starts a turn with the timer set and the first item on screen', () => {
    const turn = send(wordDuel, start(wordDuel, { input, seed: 1 }), { type: 'start' }, { now: 5_000 })
    expect(turn.phase).toBe('turn')
    expect(turn.context.turnEndsAt).toBe(35_000)
    expect(turn.context.item).toBe(turn.context.pool.drawn[0])
  })

  it('records the turn as it goes and banks its points only when leaving the summary', () => {
    let state = send(wordDuel, start(wordDuel, { input, seed: 1 }), { type: 'start' }, { now: 0 })
    const first = state.context.item
    state = send(wordDuel, state, { type: 'got' }, { now: 0 })
    const second = state.context.item
    state = send(wordDuel, state, { type: 'skip' }, { now: 0 })
    state = send(wordDuel, state, { type: 'time_up' }, { now: 0 })

    expect(state.phase).toBe('turn_summary')
    expect(state.context.turn).toEqual({ got: [first], skipped: [second] })
    expect(state.context.scores).toEqual([0, 0])

    state = send(wordDuel, state, { type: 'next' }, { now: 0 })
    expect(state.phase).toBe('handoff')
    expect(state.context.scores).toEqual([1, 0])
    expect(state.context.current).toBe(1)
  })

  it('plays from the first handoff to the results', () => {
    const states = playToEnd(start(wordDuel, { input, seed: 2026 }))
    const end = states.at(-1)!

    expect(states).toHaveLength(1 + 4) // the start, then 2 teams × 2 rounds
    expect(states.slice(1, -1).map((s) => s.phase)).toEqual(['handoff', 'handoff', 'handoff'])
    expect(end.phase).toBe('results')
    expect(end.context.scores).toEqual([4, 4]) // two words got per turn, two turns each
  })

  it('reshuffles once every word has been drawn, so a long game never runs out', () => {
    // 4 turns × 4 draws (one at start, one after each got or skip) = 16 draws from 5 words.
    const end = playToEnd(start(wordDuel, { input, seed: 2026 })).at(-1)!
    expect(end.context.pool.remaining.length + end.context.pool.drawn.length).toBe(5)
  })

  it('ignores events once the game has ended', () => {
    const end = playToEnd(start(wordDuel, { input, seed: 2026 })).at(-1)!
    expect(send(wordDuel, end, { type: 'start' }, { now: 0 })).toBe(end)
  })

  // Pinned with seed 2026. If the format, the pool, the runner or the Rng changes, this order changes:
  // decide whether that's intended.
  it('gives the same draws every time for the same seed', () => {
    const turn = send(wordDuel, start(wordDuel, { input, seed: 2026 }), { type: 'start' }, { now: 0 })
    const again = send(wordDuel, start(wordDuel, { input, seed: 2026 }), { type: 'start' }, { now: 0 })
    expect(again).toEqual(turn)
    expect(turn.context.item).toBe('sun')
  })

  it('finishes the same way after a save and reload halfway through', () => {
    const first = start(wordDuel, { input, seed: 2026 })
    const halfway = playTurn(playTurn(first, 60_000), 120_000)
    const reloaded: WordState = JSON.parse(JSON.stringify(halfway))

    expect(playToEnd(reloaded, 120_000).at(-1)).toEqual(playToEnd(halfway, 120_000).at(-1))
    expect(playToEnd(reloaded, 120_000).at(-1)).toEqual(playToEnd(first).at(-1))
  })

  // Checked by `pnpm typecheck`; at runtime these lines do nothing.
  it('works out the names from the game and adds the format’s', () => {
    expectTypeOf<keyof typeof wordDuel.phases>().toEqualTypeOf<'handoff' | 'turn' | 'turn_summary' | 'results'>()
    expectTypeOf<keyof typeof wordDuel.guards>().toEqualTypeOf<'turnsRemaining'>()
    expectTypeOf<keyof typeof wordDuel.actions>().toEqualTypeOf<
      'markGot' | 'markSkipped' | 'startTurn' | 'drawItem' | 'bankPoints' | 'advanceTeam'
    >()
  })
})

// Mistakes that must be type errors on the game's own line (ADR 0004).
const record = { newTurn: () => ({ got: [], skipped: [] }), points: () => 0 }

export const mistakes = [
  defineWordDuel({
    ...record,
    // @ts-expect-error: 'turn_sumary' is not a phase (typo for 'turn_summary')
    phases: { turn: { interaction: 'flash_card', on: { time_up: { to: 'turn_sumary' } } } },
    guards: {},
    actions: {},
  }),
  defineWordDuel({
    ...record,
    // @ts-expect-error: 'markGott' is not an action (typo for 'markGot')
    phases: { turn: { interaction: 'flash_card', on: { got: { actions: ['markGott'] } } } },
    guards: {},
    actions: { markGot: ({ context }) => context },
  }),
  defineWordDuel({
    ...record,
    // @ts-expect-error: 'markGot' is used but no such action is written
    phases: { turn: { interaction: 'flash_card', on: { got: { actions: ['markGot'] } } } },
    guards: {},
    actions: {},
  }),
  defineWordDuel({
    ...record,
    // @ts-expect-error: a game can't jump to the results; only the format ends the game
    phases: { turn: { interaction: 'flash_card', on: { got: { to: 'results' } } } },
    guards: {},
    actions: {},
  }),
  defineWordDuel({
    ...record,
    // @ts-expect-error: there's no `turn` phase for the handoff to start
    phases: { play: { interaction: 'flash_card' } },
    guards: {},
    actions: {},
  }),
  defineWordDuel({
    ...record,
    // @ts-expect-error: `handoff` is the format's phase
    phases: { turn: { interaction: 'flash_card' }, handoff: { interaction: 'handoff' } },
    guards: {},
    actions: {},
  }),
  defineWordDuel({
    ...record,
    phases: { turn: { interaction: 'flash_card' } },
    guards: {},
    // @ts-expect-error: `drawItem` is the format's action
    actions: { drawItem: ({ context }: { context: TeamTurnsContext<string, WordTurn> }) => context },
  }),
  defineWordDuel({
    ...record,
    // @ts-expect-error: a game phase can't be final; only the format ends the game
    phases: { turn: { interaction: 'flash_card', final: true } },
    guards: {},
    actions: {},
  }),
  defineWordDuel({
    ...record,
    // @ts-expect-error: 'jump' is not one of the game's events
    phases: { turn: { interaction: 'flash_card', on: { jump: { to: 'turn_summary' } } } },
    guards: {},
    actions: {},
  }),
]
