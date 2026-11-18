import { describe, expect, it } from 'vitest'
import { loadPacks } from '../../sdk/content/loadPacks'
import { choosePoolItems } from '../../sdk/formats/team-turns/pool'
import type { TeamTurnsContext } from '../../sdk/formats/team-turns/rules'
import type { TeamTurnsEvent } from '../../sdk/formats/team-turns/teamTurns'
import { isFinal, send, start } from '../../sdk/machine/runner'
import type { MachineState } from '../../sdk/machine/types'
import { validateMachine } from '../../sdk/machine/validateMachine'
import { createRng } from '../../sdk/rng'
import { NameTenConfig } from './config'
import { deal, machine, type NameTenEvent, type NameTenTurn } from './machine'
import { itemKey, itemSchema, type NameTenItem } from './schema'

type Context = TeamTurnsContext<NameTenItem, NameTenTurn, NameTenConfig>
type State = MachineState<Context, keyof typeof machine.phases>
type Event = NameTenEvent | TeamTurnsEvent

// A real game: the settings from setup and the categories from the real Back to School pack.
const packs = loadPacks(import.meta.glob('./content/*.json', { eager: true, import: 'default' }), itemSchema, itemKey)
const config = NameTenConfig.parse({ teams: ['Lions', 'Eagles'], packs: ['back-to-school'] })
const items = choosePoolItems(packs, config, itemKey)
const input = { config, items }

const play = (state: State, ...events: Event[]) => events.reduce((current, event) => send(machine, current, event, { now: 0 }), state)
const toggle = (index: number): Event => ({ type: 'toggle', index })

/** A game at the start of the first turn: a category drawn and its board dealt. */
const firstTurn = (seed = 1, gameInput = input) => play(start(machine, { input: gameInput, seed }), { type: 'start' })
const points = (state: State) => machine.points(state.context.turn, state.context.config)

describe('Name Ten machine', () => {
  it('has no mistakes validateMachine can find', () => {
    expect(validateMachine(machine)).toEqual([])
  })

  it('start: deals the setting’s number of the category’s answers onto the board (all of them if it has fewer), none ticked', () => {
    const state = firstTurn()
    const { board, got } = state.context.turn
    expect(state.phase).toBe('turn')
    expect(board).toHaveLength(10)
    expect(new Set(board).size).toBe(10)
    for (const answer of board) expect(state.context.item!.answers).toContain(answer)
    expect(got).toEqual(Array(10).fill(false))

    // Up to the setting: a category with fewer answers puts all of them on the board.
    const big = firstTurn(1, { config: { ...config, shown: 15 }, items }).context
    expect(big.turn.board).toHaveLength(Math.min(15, big.item!.answers.length))
  })

  it('start: the same seed deals the same board, and another seed shuffles it differently', () => {
    expect(firstTurn(7).context.turn).toEqual(firstTurn(7).context.turn)
    const [a, b] = [firstTurn(7), firstTurn(8)]
    expect(a.context.item === b.context.item && a.context.turn.board.join() === b.context.turn.board.join()).toBe(false)
  })

  it('toggle: ticks and unticks the answer named, and the turn is worth one point per tick', () => {
    const state = play(firstTurn(), toggle(0), toggle(3), toggle(5), toggle(3))
    expect(state.context.turn.got.map((on, index) => (on ? index : -1)).filter((index) => index >= 0)).toEqual([0, 5])
    expect(points(state)).toBe(2)
  })

  it('lock_in and time_up both end the turn in review, where a correction counts and done goes on to the summary', () => {
    const early = play(firstTurn(), toggle(0), { type: 'lock_in' })
    expect(early.phase).toBe('review')
    expect(play(firstTurn(), toggle(0), { type: 'time_up' }).phase).toBe('review')

    const corrected = play(early, toggle(9), toggle(0))
    expect(points(corrected)).toBe(1) // answer 9 counted, answer 0 unticked
    const summary = play(corrected, { type: 'done' })
    expect(summary.phase).toBe('turn_summary')
    expect(play(summary, { type: 'next' }).context.scores).toEqual([1, 0])
  })

  it('ignores a toggle for an answer not on the board, and toggles outside a turn or review', () => {
    const turn = firstTurn()
    for (const index of [10, -1, 2.5]) expect(play(turn, toggle(index))).toEqual(turn)
    const handoff = start(machine, { input, seed: 1 })
    expect(play(handoff, toggle(0))).toEqual(handoff)
    const summary = play(turn, { type: 'lock_in' }, { type: 'done' })
    expect(play(summary, toggle(0))).toEqual(summary)
  })

  it('plays a full game from the first handoff to the results', () => {
    // Each turn: three ticks, the judge ends early, a fourth answer counted in review.
    const turn: Event[] = [{ type: 'start' }, toggle(0), toggle(1), toggle(2), { type: 'lock_in' }, toggle(3), { type: 'done' }, { type: 'next' }]
    let state: State = start(machine, { input, seed: 2026 })
    let turns = 0
    while (!isFinal(machine, state)) {
      state = play(state, ...turn)
      if (++turns > 100) throw new Error('The game never ended')
    }

    expect(turns).toBe(6) // 2 teams × 3 rounds
    expect(state.phase).toBe('results')
    expect(state.context.scores).toEqual([12, 12]) // 4 a turn, 3 turns each
    const drawn = state.context.pool.drawn.map((item) => item.category)
    expect(new Set(drawn).size).toBe(6) // one category per turn, none repeated
  })
})

describe('Name Ten guards and actions', () => {
  const category: NameTenItem = { category: 'Numbers', answers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'], tags: [] }
  const base = firstTurn().context
  const context: Context = { ...base, item: category, turn: { board: ['0', '1', '2'], got: [false, true, false] } }
  const rng = createRng(3)

  it('deal: takes each answer at most once, in a shuffled order', () => {
    const dealt = deal(category.answers, 10, createRng(3))
    expect(dealt).toHaveLength(10)
    expect(new Set(dealt).size).toBe(10)
    expect(dealt).not.toEqual(category.answers.slice(0, 10))
    expect(deal(category.answers, 10, createRng(3))).toEqual(dealt)
  })

  it('dealBoard deals the setting’s number of answers, none ticked, without changing the context passed in', () => {
    const before = structuredClone(context)
    const after = machine.actions.dealBoard({ context, event: { type: 'start' }, rng, now: 0 })
    expect(after.turn.board).toHaveLength(10)
    expect(after.turn.got).toEqual(Array(10).fill(false))
    expect(context).toEqual(before)
  })

  it('toggleAnswer flips only the answer named, without changing the context passed in', () => {
    const after = machine.actions.toggleAnswer({ context, event: toggle(1), rng, now: 0 })
    expect(after.turn.got).toEqual([false, false, false])
    expect(context.turn.got).toEqual([false, true, false])
  })

  it('isAnswer is true only for a toggle naming an answer on the board', () => {
    const isAnswer = (event: Event) => machine.guards.isAnswer({ context, event })
    expect([0, 2].map((index) => isAnswer(toggle(index)))).toEqual([true, true])
    expect([3, -1, 0.5].map((index) => isAnswer(toggle(index)))).toEqual([false, false, false])
    expect(isAnswer({ type: 'lock_in' })).toBe(false)
  })
})
