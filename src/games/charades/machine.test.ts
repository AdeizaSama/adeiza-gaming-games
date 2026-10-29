import { describe, expect, it } from 'vitest'
import { isFinal, send, start } from '../../sdk/machine/runner'
import type { MachineState } from '../../sdk/machine/types'
import { validateMachine } from '../../sdk/machine/validateMachine'
import { TeamTurnsConfig } from '../../sdk/formats/team-turns/config'
import { choosePoolItems } from '../../sdk/formats/team-turns/pool'
import type { TeamTurnsContext } from '../../sdk/formats/team-turns/rules'
import type { TeamTurnsEvent } from '../../sdk/formats/team-turns/teamTurns'
import { createRng } from '../../sdk/rng'
import charades from './index'
import { machine, type CharadesEvent, type CharadesTurn } from './machine'
import type { CharadesItem } from './schema'

type Context = TeamTurnsContext<CharadesItem, CharadesTurn>
type State = MachineState<Context, keyof typeof machine.phases>
type Event = CharadesEvent | TeamTurnsEvent

// A real game: the settings from the setup screen, and the items from the real Back to School pack.
const config = TeamTurnsConfig.parse({ teams: ['Lions', 'Eagles'], rounds: 3, seconds: 60, packs: ['back-to-school'] })
const items = choosePoolItems(charades.content.packs, config, charades.content.itemKey)
const input = { config, items }

const play = (state: State, ...events: Event[]) => events.reduce((current, event) => send(machine, current, event, { now: 0 }), state)

/** A game at the start of the first turn: the first item on screen. */
const firstTurn = () => play(start(machine, { input, seed: 1 }), { type: 'start' })

describe('Charades game definition', () => {
  it('is a valid game with the Back to School pack', () => {
    expect(charades.meta.id).toBe('charades')
    expect(charades.content.packs.map((pack) => pack.id)).toContain('back-to-school')
    expect(charades.machine).toBe(machine)
  })
})

describe('Charades machine', () => {
  it('has no mistakes validateMachine can find', () => {
    expect(validateMachine(machine)).toEqual([])
  })

  it('got: records the item, shows the next one, and is worth a point', () => {
    const before = firstTurn()
    const after = play(before, { type: 'got' })
    expect(after.context.turn).toEqual({ got: [before.context.item], skipped: [] })
    expect(after.context.item).not.toEqual(before.context.item)

    const banked = play(after, { type: 'time_up' }, { type: 'next' })
    expect(banked.context.scores).toEqual([1, 0])
  })

  it('skip: records the item and shows the next one, with no penalty', () => {
    const before = firstTurn()
    const after = play(before, { type: 'skip' })
    expect(after.context.turn).toEqual({ got: [], skipped: [before.context.item] })
    expect(after.context.item).not.toEqual(before.context.item)

    const banked = play(after, { type: 'time_up' }, { type: 'next' })
    expect(banked.context.scores).toEqual([0, 0])
  })

  it('time_up: ends the turn without counting the item on screen', () => {
    const state = play(firstTurn(), { type: 'got' }, { type: 'time_up' })
    expect(state.phase).toBe('turn_summary')
    expect(state.context.turn.got).toHaveLength(1)
    expect(state.context.turn.skipped).toHaveLength(0)
  })

  it('ignores got and skip outside a turn', () => {
    const handoff = start(machine, { input, seed: 1 })
    expect(play(handoff, { type: 'got' })).toBe(handoff)
    const summary = play(firstTurn(), { type: 'time_up' })
    expect(play(summary, { type: 'skip' })).toBe(summary)
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
    expect(state.context.scores).toEqual([9, 9]) // 3 got a turn, 3 turns each
    const drawn = state.context.pool.drawn.map((item) => item.text)
    expect(drawn).toHaveLength(30)
    expect(new Set(drawn).size).toBe(30) // fewer draws than items, so no repeats
  })
})

describe('Charades actions', () => {
  const context = (changes: Partial<Context> = {}): Context => ({
    ...start(machine, { input, seed: 1 }).context,
    item: { text: 'Gala', tags: [], modes: ['describe'] },
    ...changes,
  })
  const args = (c: Context) => ({ context: c, event: { type: 'got' } as const, rng: createRng(1), now: 0 })

  it('markGot adds the item on screen to the items got, without changing the context passed in', () => {
    const before = context({ turn: { got: [], skipped: [] } })
    const after = machine.actions.markGot(args(before))
    expect(after.turn.got.map((item) => item.text)).toEqual(['Gala'])
    expect(before.turn.got).toEqual([])
  })

  it('markSkipped adds the item on screen to the items skipped, without changing the context passed in', () => {
    const before = context({ turn: { got: [], skipped: [] } })
    const after = machine.actions.markSkipped(args(before))
    expect(after.turn.skipped.map((item) => item.text)).toEqual(['Gala'])
    expect(before.turn.skipped).toEqual([])
  })
})
