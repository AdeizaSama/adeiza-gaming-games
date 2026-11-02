import { describe, expect, it } from 'vitest'
import { isFinal, send, start } from '../../sdk/machine/runner'
import type { MachineState } from '../../sdk/machine/types'
import { validateMachine } from '../../sdk/machine/validateMachine'
import { choosePoolItems } from '../../sdk/formats/team-turns/pool'
import type { TeamTurnsContext } from '../../sdk/formats/team-turns/rules'
import type { TeamTurnsEvent } from '../../sdk/formats/team-turns/teamTurns'
import { createRng } from '../../sdk/rng'
import { CharadesConfig } from './config'
import charades from './index'
import { entryPoints, machine, type CharadesEntry, type CharadesEvent, type CharadesTurn } from './machine'
import type { CharadesItem } from './schema'

type Context = TeamTurnsContext<CharadesItem, CharadesTurn, CharadesConfig>
type State = MachineState<Context, keyof typeof machine.phases>
type Event = CharadesEvent | TeamTurnsEvent

// A real game: the settings from the setup screen (default points: describe 2, act 3, sing 3, skip 1), and the
// items from the real Back to School pack.
const config = CharadesConfig.parse({ teams: ['Lions', 'Eagles'], rounds: 3, seconds: 60, packs: ['back-to-school'] })
const items = choosePoolItems(charades.content.packs, config, charades.content.itemKey)
const input = { config, items }
const mixInput = { config: { ...config, mode: 'mix' as const }, items }

const play = (state: State, ...events: Event[]) => events.reduce((current, event) => send(machine, current, event, { now: 0 }), state)

/** A game at the start of the first turn: the first item on screen. */
const firstTurn = (seed = 1, gameInput = input) => play(start(machine, { input: gameInput, seed }), { type: 'start' })

/** Every card logged in a game, played to the end with the same moves each turn. */
function playAll(gameInput: typeof input, seed: number, moves: Event[]) {
  let state: State = start(machine, { input: gameInput, seed })
  const entries: CharadesEntry[] = []
  while (!isFinal(machine, state)) {
    state = play(state, { type: 'start' }, ...moves)
    entries.push(...state.context.turn.entries)
    state = play(state, { type: 'time_up' }, { type: 'next' })
    if (entries.length > 1000) throw new Error('The game never ended')
  }
  return { state, entries }
}

describe('Charades game definition', () => {
  it('is a valid game with the Back to School pack and its own settings', () => {
    expect(charades.meta.id).toBe('charades')
    expect(charades.content.packs.map((pack) => pack.id)).toContain('back-to-school')
    expect(charades.machine).toBe(machine)
    expect(charades.config.schema).toBe(CharadesConfig)
  })
})

describe('Charades machine', () => {
  it('has no mistakes validateMachine can find', () => {
    expect(validateMachine(machine)).toEqual([])
  })

  it('got: logs the card as got with its mode, shows the next one, and is worth the describe points', () => {
    const before = firstTurn()
    const after = play(before, { type: 'got' })
    expect(after.context.turn.entries).toEqual([{ item: before.context.item, mode: 'describe', result: 'got' }])
    expect(after.context.item).not.toEqual(before.context.item)

    const banked = play(after, { type: 'time_up' }, { type: 'next' })
    expect(banked.context.scores).toEqual([2, 0])
  })

  it('skip: logs the card as skipped and shows the next one; a turn never scores below 0', () => {
    const before = firstTurn()
    const after = play(before, { type: 'skip' })
    expect(after.context.turn.entries).toEqual([{ item: before.context.item, mode: 'describe', result: 'skipped' }])
    expect(after.context.item).not.toEqual(before.context.item)

    const banked = play(after, { type: 'time_up' }, { type: 'next' })
    expect(banked.context.scores).toEqual([0, 0])
  })

  it('scores a turn as the sum of its cards: two got and a skip is 2 + 2 − 1', () => {
    const state = play(firstTurn(), { type: 'got' }, { type: 'got' }, { type: 'skip' }, { type: 'time_up' }, { type: 'next' })
    expect(state.context.scores).toEqual([3, 0])
  })

  it('time_up: ends the turn without logging the card on screen', () => {
    const state = play(firstTurn(), { type: 'got' }, { type: 'time_up' })
    expect(state.phase).toBe('turn_summary')
    expect(state.context.turn.entries.map((entry) => entry.result)).toEqual(['got'])
  })

  it('ignores got and skip outside a turn', () => {
    const handoff = start(machine, { input, seed: 1 })
    expect(play(handoff, { type: 'got' })).toBe(handoff)
    const summary = play(firstTurn(), { type: 'time_up' })
    expect(play(summary, { type: 'skip' })).toBe(summary)
  })

  it('describe: plays every card as describe, even items that can be acted or sung', () => {
    const { entries } = playAll(input, 2026, [{ type: 'got' }, { type: 'got' }, { type: 'skip' }, { type: 'got' }])
    expect(entries.some((entry) => entry.item.modes.length > 1)).toBe(true)
    expect(entries.every((entry) => entry.mode === 'describe')).toBe(true)
  })

  // 2 teams × 3 rounds × 4 cards = 24 cards, most of which can be acted (29 of 34 items in the pack).
  it('mix it up: gives each card one of its item’s modes, so describe-only items are still described', () => {
    const { entries } = playAll(mixInput, 2026, [{ type: 'got' }, { type: 'got' }, { type: 'skip' }, { type: 'got' }])
    expect(entries).toHaveLength(24)
    for (const entry of entries) expect(entry.item.modes).toContain(entry.mode)
    expect(entries.some((entry) => entry.mode === 'act')).toBe(true)
    expect(entries.some((entry) => entry.mode === 'describe' && entry.item.modes.length > 1)).toBe(true)
  })

  it('mix it up: picks the first card’s mode too, and the same seed picks the same modes', () => {
    const modes = (seed: number) => {
      let state = firstTurn(seed, mixInput)
      const picked = [state.context.turn.mode]
      for (let card = 0; card < 10; card++) {
        state = play(state, { type: 'got' })
        picked.push(state.context.turn.mode)
      }
      return picked
    }
    expect(modes(7)).toEqual(modes(7))
    expect(new Set(modes(7)).size).toBeGreaterThan(1)
  })

  // Seed 2026, Back to School (34 items). Each team's turn: got, got, skip, got, then time up. That's 5 draws a turn
  // (one at the start, one after each got or skip), 30 in all.
  it('plays a full game from the first handoff to the results', () => {
    const turn: Event[] = [{ type: 'start' }, { type: 'got' }, { type: 'got' }, { type: 'skip' }, { type: 'got' }, { type: 'time_up' }, { type: 'next' }]
    let state: State = start(machine, { input, seed: 2026 })
    let turns = 0
    while (!isFinal(machine, state)) {
      state = play(state, ...turn)
      if (++turns > 100) throw new Error('The game never ended')
    }

    expect(turns).toBe(6) // 2 teams × 3 rounds
    expect(state.phase).toBe('results')
    expect(state.context.scores).toEqual([15, 15]) // 3 × 2 − 1 = 5 a turn, 3 turns each
    const drawn = state.context.pool.drawn.map((item) => item.text)
    expect(drawn).toHaveLength(30)
    expect(new Set(drawn).size).toBe(30) // fewer draws than items, so no repeats
  })
})

describe('Charades scoring', () => {
  const gala: CharadesItem = { text: 'Gala', tags: [], modes: ['describe', 'act', 'sing'] }
  const entry = (mode: CharadesEntry['mode'], result: CharadesEntry['result']): CharadesEntry => ({ item: gala, mode, result })

  it('entryPoints: a got card earns its mode’s points, a skipped card costs the skip points', () => {
    const points = { describe: 1, act: 4, sing: 5, skip: 2 }
    expect(entryPoints(entry('describe', 'got'), points)).toBe(1)
    expect(entryPoints(entry('act', 'got'), points)).toBe(4)
    expect(entryPoints(entry('sing', 'got'), points)).toBe(5)
    expect(entryPoints(entry('act', 'skipped'), points)).toBe(-2)
  })

  it('points: adds up the turn’s cards under the game’s settings, never below 0', () => {
    const turn = (entries: CharadesEntry[]): CharadesTurn => ({ entries, mode: 'describe' })
    expect(machine.points(turn([entry('act', 'got'), entry('sing', 'got'), entry('describe', 'skipped')]), config)).toBe(5)
    expect(machine.points(turn([entry('describe', 'got')]), { ...config, points: { ...config.points, describe: 4 } })).toBe(4)
    expect(machine.points(turn([entry('describe', 'skipped'), entry('describe', 'skipped')]), config)).toBe(0)
    expect(machine.points(turn([]), config)).toBe(0)
  })
})

describe('Charades actions', () => {
  const context = (changes: Partial<Context> = {}): Context => ({
    ...start(machine, { input, seed: 1 }).context,
    item: { text: 'Gala', tags: [], modes: ['describe', 'sing'] },
    ...changes,
  })
  const args = (c: Context) => ({ context: c, event: { type: 'got' } as const, rng: createRng(1), now: 0 })

  it('markGot logs the card on screen as got, in its mode, without changing the context passed in', () => {
    const before = context({ turn: { entries: [], mode: 'sing' } })
    const after = machine.actions.markGot(args(before))
    expect(after.turn.entries).toEqual([{ item: before.item, mode: 'sing', result: 'got' }])
    expect(before.turn.entries).toEqual([])
  })

  it('markSkipped logs the card on screen as skipped, in its mode, without changing the context passed in', () => {
    const before = context({ turn: { entries: [], mode: 'describe' } })
    const after = machine.actions.markSkipped(args(before))
    expect(after.turn.entries).toEqual([{ item: before.item, mode: 'describe', result: 'skipped' }])
    expect(before.turn.entries).toEqual([])
  })

  it('pickMode picks describe in describe mode, and one of the item’s modes in mix it up', () => {
    expect(machine.actions.pickMode(args(context({ turn: { entries: [], mode: 'sing' } }))).turn.mode).toBe('describe')
    const mix = context({ config: { ...config, mode: 'mix' } })
    const picked = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((seed) => machine.actions.pickMode({ ...args(mix), rng: createRng(seed) }).turn.mode))
    expect([...picked].sort()).toEqual(['describe', 'sing'])
  })
})
