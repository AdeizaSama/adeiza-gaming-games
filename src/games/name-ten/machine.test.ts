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
import { deal, machine, maxSkips, type NameTenEvent, type NameTenTurn } from './machine'
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

/** A game at the category, before the first turn: a category drawn and its board dealt, no clock yet. */
const firstCategory = (seed = 1, gameInput = input) => play(start(machine, { input: gameInput, seed }), { type: 'start' })
/** A game at the start of the first turn: the first category played. */
const firstTurn = (seed = 1, gameInput = input) => play(firstCategory(seed, gameInput), { type: 'play' })
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

  it('category: shows the category with its board dealt but no clock, and play starts the turn on it', () => {
    const category = firstCategory()
    expect(category.phase).toBe('category')
    expect(category.context.turnEndsAt).toBeNull()
    expect(category.context.turn.board).toHaveLength(10)

    const turn = send(machine, category, { type: 'play' }, { now: 5_000 })
    expect(turn.phase).toBe('turn')
    expect(turn.context.turnEndsAt).toBe(65_000)
    expect(turn.context.item).toBe(category.context.item)
    expect(turn.context.turn.board).toEqual(category.context.turn.board)
  })

  it('category: skip draws the next category and deals its board, three times at most, and a skipped one is gone for good', () => {
    const first = firstCategory()
    const skipped = play(first, { type: 'skip' })
    expect(skipped.phase).toBe('category')
    expect(skipped.context.item).not.toBe(first.context.item)
    for (const answer of skipped.context.turn.board) expect(skipped.context.item!.answers).toContain(answer)
    expect(skipped.context.turn.skips).toBe(1)

    const out = play(skipped, { type: 'skip' }, { type: 'skip' })
    expect(out.context.turn.skips).toBe(maxSkips)
    expect(play(out, { type: 'skip' })).toEqual(out) // no skips left
    expect(out.context.pool.drawn.slice(0, 3)).toEqual(
      [first, skipped, play(skipped, { type: 'skip' })].map((state) => state.context.item),
    )
  })

  it('category: a new turn gets its skips back, and play and skip are ignored once the turn has started', () => {
    const turn = play(firstCategory(), { type: 'skip' }, { type: 'play' })
    expect(turn.context.turn.skips).toBe(1)
    expect(play(turn, { type: 'skip' })).toEqual(turn)
    const next = play(turn, { type: 'lock_in' }, { type: 'done' }, { type: 'next' }, { type: 'start' })
    expect(next.phase).toBe('category')
    expect(next.context.turn.skips).toBe(0)
  })

  it('plays a full game from the first handoff to the results', () => {
    // Each turn: one category skipped, three ticks, the judge ends early, a fourth answer counted in review.
    const turn: Event[] = [{ type: 'start' }, { type: 'skip' }, { type: 'play' }, toggle(0), toggle(1), toggle(2), { type: 'lock_in' }, toggle(3), { type: 'done' }, { type: 'next' }]
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
    expect(drawn).toHaveLength(12) // one skipped and one played each turn
    expect(new Set(drawn).size).toBe(12) // none repeated
  })
})

describe('Name Ten guards and actions', () => {
  const category: NameTenItem = { category: 'Numbers', answers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'], tags: [] }
  const base = firstTurn().context
  const context: Context = { ...base, item: category, turn: { board: ['0', '1', '2'], got: [false, true, false], skips: 2 } }
  const rng = createRng(3)

  it('deal: takes each answer at most once, in a shuffled order', () => {
    const dealt = deal(category.answers, 10, createRng(3))
    expect(dealt).toHaveLength(10)
    expect(new Set(dealt).size).toBe(10)
    expect(dealt).not.toEqual(category.answers.slice(0, 10))
    expect(deal(category.answers, 10, createRng(3))).toEqual(dealt)
  })

  it('dealBoard deals the setting’s number of answers, none ticked, keeping the skips, without changing the context passed in', () => {
    const before = structuredClone(context)
    const after = machine.actions.dealBoard({ context, event: { type: 'start' }, rng, now: 0 })
    expect(after.turn.board).toHaveLength(10)
    expect(after.turn.got).toEqual(Array(10).fill(false))
    expect(after.turn.skips).toBe(2)
    expect(context).toEqual(before)
  })

  it('countSkip counts one more skip, and canSkip is true only while skips are left', () => {
    expect(machine.actions.countSkip({ context, event: { type: 'skip' }, rng, now: 0 }).turn.skips).toBe(3)
    expect(context.turn.skips).toBe(2)
    const canSkip = (skips: number) => machine.guards.canSkip({ context: { ...context, turn: { ...context.turn, skips } }, event: { type: 'skip' } })
    expect([0, 2, 3].map(canSkip)).toEqual([true, true, false])
  })

  it('toggleAnswer flips only the answer named, without changing the context passed in', () => {
    const after = machine.actions.toggleAnswer({ context, event: toggle(1), rng, now: 0 })
    expect(after.turn.got).toEqual([false, false, false])
    expect(after.turn.skips).toBe(2)
    expect(context.turn.got).toEqual([false, true, false])
  })

  it('isAnswer is true only for a toggle naming an answer on the board', () => {
    const isAnswer = (event: Event) => machine.guards.isAnswer({ context, event })
    expect([0, 2].map((index) => isAnswer(toggle(index)))).toEqual([true, true])
    expect([3, -1, 0.5].map((index) => isAnswer(toggle(index)))).toEqual([false, false, false])
    expect(isAnswer({ type: 'lock_in' })).toBe(false)
  })
})
