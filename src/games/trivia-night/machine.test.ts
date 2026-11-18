import { describe, expect, it } from 'vitest'
import { loadPacks } from '../../sdk/content/loadPacks'
import { choosePoolItems } from '../../sdk/formats/team-turns/pool'
import type { TeamTurnsContext } from '../../sdk/formats/team-turns/rules'
import type { TeamTurnsEvent } from '../../sdk/formats/team-turns/teamTurns'
import { isFinal, send, start } from '../../sdk/machine/runner'
import type { MachineState } from '../../sdk/machine/types'
import { validateMachine } from '../../sdk/machine/validateMachine'
import { createRng } from '../../sdk/rng'
import { TriviaConfig } from './config'
import { machine, type TriviaEvent, type TriviaTurn } from './machine'
import { itemKey, itemSchema, type TriviaItem } from './schema'

type Context = TeamTurnsContext<TriviaItem, TriviaTurn, TriviaConfig>
type State = MachineState<Context, keyof typeof machine.phases>
type Event = TriviaEvent | TeamTurnsEvent

// A real game: the settings from setup and the questions from the real Back to School pack.
const packs = loadPacks(import.meta.glob('./content/*.json', { eager: true, import: 'default' }), itemSchema, itemKey)
const configWith = (changes: Partial<TriviaConfig> = {}) => TriviaConfig.parse({ teams: ['Lions', 'Eagles'], packs: ['back-to-school'], ...changes })
const config = configWith()
const items = choosePoolItems(packs, config, itemKey)

const play = (state: State, ...events: Event[]) => events.reduce((current, event) => send(machine, current, event, { now: 0 }), state)
const answer = (index: number): Event => ({ type: 'answer', index })
/** Where the right option is on screen, and a wrong one. */
const right = (state: State) => state.context.turn.options.indexOf(state.context.item!.answer)
const wrong = (state: State) => (right(state) + 1) % state.context.turn.options.length
/** Answers the question on screen, right or wrong. */
const answerIt = (state: State, correct = true) => play(state, answer(correct ? right(state) : wrong(state)))

/** A game at the first question of the first turn. */
const firstTurn = (changes: Partial<TriviaConfig> = {}, seed = 1) => play(start(machine, { input: { config: configWith(changes), items }, seed }), { type: 'start' })
const points = (state: State) => machine.points(state.context.turn, state.context.config)

describe('Trivia Night machine', () => {
  it('has no mistakes validateMachine can find', () => {
    expect(validateMachine(machine)).toEqual([])
  })

  it('start: shows the first question with its options shuffled, nothing picked, and a 30-second clock', () => {
    const state = send(machine, start(machine, { input: { config, items }, seed: 1 }), { type: 'start' }, { now: 1_000 })
    expect(state.phase).toBe('turn')
    expect(state.context.turnEndsAt).toBe(31_000)
    const { options, picked, results } = state.context.turn
    expect([...options].sort()).toEqual([...state.context.item!.options].sort())
    expect([picked, results]).toEqual([null, []])
    // Another seed puts the same question's options in another order, somewhere in the pack.
    const orders = [1, 2, 3, 4, 5].map((seed) => firstTurn({}, seed).context.turn.options.join())
    expect(new Set(orders).size).toBeGreaterThan(1)
  })

  it('answer: a right pick is worth the points setting, a wrong one nothing, and both show the result', () => {
    const correct = answerIt(firstTurn())
    expect(correct.phase).toBe('reveal')
    expect(correct.context.turn.picked).toBe(right(correct))
    expect([correct.context.turn.results, points(correct)]).toEqual([[true], 1])

    const missed = answerIt(firstTurn(), false)
    expect([missed.context.turn.results, points(missed)]).toEqual([[false], 0])

    expect(points(answerIt(firstTurn({ points: 3 })))).toBe(3)
  })

  it('ignores an answer for no option, a second answer, and an answer outside the turn', () => {
    const turn = firstTurn()
    for (const index of [-1, 4, 1.5]) expect(play(turn, answer(index))).toEqual(turn)
    const reveal = answerIt(turn)
    expect(play(reveal, answer(0))).toEqual(reveal)
    const summary = play(reveal, { type: 'continue' })
    expect(play(summary, answer(0))).toEqual(summary)
  })

  it('one question a turn: continue after the result ends the turn', () => {
    const summary = play(answerIt(firstTurn()), { type: 'continue' })
    expect(summary.phase).toBe('turn_summary')
  })

  it('a set number: continue draws the next question until that many are answered, then ends the turn', () => {
    let state = firstTurn({ questions: 3 })
    const asked = [state.context.item]
    for (const correct of [true, false]) {
      state = play(answerIt(state, correct), { type: 'continue' })
      expect(state.phase).toBe('turn')
      expect(state.context.turn.picked).toBeNull()
      asked.push(state.context.item)
    }
    expect(new Set(asked).size).toBe(3)
    state = answerIt(state)
    expect([state.context.turn.results, points(state)]).toEqual([[true, false, true], 2])
    expect(play(state, { type: 'continue' }).phase).toBe('turn_summary')
  })

  it('against the clock: questions keep coming, and time_up ends the turn from a question or a result', () => {
    let state = firstTurn({ mode: 'clock', questions: 1 })
    for (let i = 0; i < 12; i++) state = play(answerIt(state), { type: 'continue' })
    expect(state.phase).toBe('turn')
    expect(points(state)).toBe(12)
    expect(play(state, { type: 'time_up' }).phase).toBe('turn_summary')
    expect(play(answerIt(state), { type: 'time_up' }).phase).toBe('turn_summary')
  })

  it('A to Z: the options in alphabetical order', () => {
    const state = firstTurn({ order: 'alphabetical' })
    const { options } = state.context.turn
    expect(options).toEqual([...options].sort(new Intl.Collator('en', { numeric: true, sensitivity: 'base' }).compare))
  })

  it('plays a full game from the first handoff to the results', () => {
    let state = start(machine, { input: { config, items }, seed: 2026 })
    // Each turn: one question; Lions always right, Eagles always wrong.
    for (let turn = 0; turn < 6; turn++) {
      state = play(state, { type: 'start' })
      state = play(answerIt(state, turn % 2 === 0), { type: 'continue' }, { type: 'next' })
    }
    expect(isFinal(machine, state)).toBe(true)
    expect(state.context.scores).toEqual([3, 0])
    expect(new Set(state.context.pool.drawn.map(itemKey)).size).toBe(6) // a question per turn, none repeated
  })
})

describe('Trivia Night guards and actions', () => {
  const item: TriviaItem = { question: 'Capital?', options: ['Lagos', 'Abuja', 'Kano'], answer: 'Abuja', tags: [] }
  const base = machine.context({ input: { config, items: [item] }, rng: createRng(1) })
  const context: Context = { ...base, item, turn: { options: ['Kano', 'Abuja', 'Lagos'], picked: null, results: [true] } }
  const rng = createRng(1)

  it('dealOptions puts the options in the order set, nothing picked, keeping the results, without changing the context passed in', () => {
    const before = structuredClone(context)
    const picked = { ...context, turn: { ...context.turn, picked: 1 } }
    const shuffled = machine.actions.dealOptions({ context: picked, event: { type: 'start' }, rng, now: 0 })
    expect([...shuffled.turn.options].sort()).toEqual(['Abuja', 'Kano', 'Lagos'])
    expect([shuffled.turn.picked, shuffled.turn.results]).toEqual([null, [true]])
    const sorted = machine.actions.dealOptions({ context: { ...context, config: { ...config, order: 'alphabetical' } }, event: { type: 'start' }, rng, now: 0 })
    expect(sorted.turn.options).toEqual(['Abuja', 'Kano', 'Lagos'])
    expect(context).toEqual(before)
  })

  it('pick records the option and whether it was the answer, without changing the context passed in', () => {
    const before = structuredClone(context)
    expect(machine.actions.pick({ context, event: { type: 'answer', index: 1 }, rng, now: 0 }).turn).toEqual({ ...context.turn, picked: 1, results: [true, true] })
    expect(machine.actions.pick({ context, event: { type: 'answer', index: 0 }, rng, now: 0 }).turn.results).toEqual([true, false])
    expect(context).toEqual(before)
  })

  it('isOption is true only for an answer naming an option; moreQuestions follows the mode and the count', () => {
    const isOption = (index: number) => machine.guards.isOption({ context, event: { type: 'answer', index } })
    expect([0, 2, 3, -1, 0.5].map(isOption)).toEqual([true, true, false, false, false])
    const more = (changes: Partial<TriviaConfig>) => machine.guards.moreQuestions({ context: { ...context, config: { ...config, ...changes } }, event: { type: 'continue' } })
    expect([more({ questions: 1 }), more({ questions: 2 }), more({ mode: 'clock', questions: 1 })]).toEqual([false, true, true])
  })
})
