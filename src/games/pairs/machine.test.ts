import { describe, expect, it } from 'vitest'
import { loadPacks } from '../../sdk/content/loadPacks'
import { choosePoolItems, newPool } from '../../sdk/formats/team-turns/pool'
import type { TeamTurnsContext } from '../../sdk/formats/team-turns/rules'
import type { TeamTurnsEvent } from '../../sdk/formats/team-turns/teamTurns'
import { isFinal, send, start } from '../../sdk/machine/runner'
import type { MachineState } from '../../sdk/machine/types'
import { validateMachine } from '../../sdk/machine/validateMachine'
import { createRng } from '../../sdk/rng'
import { PairsConfig } from './config'
import { dealRound, machine, type PairsEvent, type PairsRound, type PairsTurn } from './machine'
import { itemKey, itemSchema, type PairsItem } from './schema'

type Context = TeamTurnsContext<PairsItem, PairsTurn, PairsConfig>
type State = MachineState<Context, keyof typeof machine.phases>
type Event = PairsEvent | TeamTurnsEvent

// The real packs: Français–anglais (two-way) for flip and match, Les thèmes (one-way) for odd-one-out.
const packs = loadPacks(import.meta.glob('./content/*.json', { eager: true, import: 'default' }), itemSchema, itemKey)
const words = packs.find((pack) => pack.id === 'francais-anglais')!.items
const themes = packs.find((pack) => pack.id === 'les-themes')!.items

const configWith = (changes: Partial<PairsConfig> = {}) =>
  PairsConfig.parse({ teams: ['Lions', 'Eagles'], packs: [changes.play === 'odd' ? 'les-themes' : 'francais-anglais'], ...changes })
const itemsFor = (config: PairsConfig) => choosePoolItems(packs, config, itemKey)
const play = (state: State, ...events: Event[]) => events.reduce((current, event) => send(machine, current, event, { now: 0 }), state)
const firstTurn = (changes: Partial<PairsConfig> = {}, seed = 1) => {
  const config = configWith(changes)
  return play(start(machine, { input: { config, items: itemsFor(config) }, seed }), { type: 'start' })
}
const round = (state: State) => state.context.turn.round!
const pickRound = (state: State) => round(state) as Extract<PairsRound, { kind: 'pick' }>
const points = (state: State) => machine.points(state.context.turn, state.context.config)
/** Picks the right tiles (or, with `wrong`, one wrong one instead of the first right one) and checks. */
const pickAndCheck = (state: State, wrong = false) => {
  const { answers, options } = pickRound(state)
  const picks = wrong ? [options.findIndex((_, i) => !answers.includes(i)), ...answers.slice(1)] : answers
  return play(state, ...picks.map((index): Event => ({ type: 'pick', index })), { type: 'check' })
}
/** The partner of a side, in either direction. */
const partner = (text: string) => words.find((pair) => pair.front === text)?.back ?? words.find((pair) => pair.back === text)?.front

describe('Pairs machine', () => {
  it('has no mistakes validateMachine can find', () => {
    expect(validateMachine(machine)).toEqual([])
  })

  it('flip: shows a card, flips it, and scores Knew it 1 and Not yet 0, then ends the turn after the cards', () => {
    const turn = firstTurn({ cards: 2 })
    const card = round(turn) as Extract<PairsRound, { kind: 'flip' }>
    expect(card.kind).toBe('flip')
    expect(partner(card.front)).toBe(card.back)
    const flipped = play(turn, { type: 'flip' })
    expect(flipped.phase).toBe('reveal')
    const second = play(flipped, { type: 'knew' })
    expect([second.phase, second.context.turn.results]).toEqual(['turn', [1]])
    expect(round(second)).not.toEqual(card)
    const done = play(second, { type: 'flip' }, { type: 'not_yet' })
    expect([done.phase, done.context.turn.results, points(done)]).toEqual(['turn_summary', [1, 0], 1])
  })

  it('flip: two-way shows either side first across cards; one-way always the front', () => {
    const fronts = new Set(words.map((pair) => pair.front))
    const sides = (twoWay: boolean) =>
      Array.from({ length: 20 }, (_, seed) => fronts.has((round(firstTurn({ twoWay }, seed)) as { front: string }).front))
    expect(new Set(sides(true)).size).toBe(2)
    expect(sides(false).every(Boolean)).toBe(true)
  })

  it('match: three prompts, ten distinct tiles, their three partners among them, and no other tile any prompt’s partner', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const { prompts, options, answers } = pickRound(firstTurn({ play: 'match' }, seed))
      expect([prompts.length, options.length, answers.length]).toEqual([3, 10, 3])
      expect(new Set(options.map((option) => option.toLowerCase())).size).toBe(10)
      expect(answers.map((index) => options[index]).sort()).toEqual(prompts.map(partner).sort())
      for (const [index, option] of options.entries()) if (!answers.includes(index)) expect(prompts.map(partner)).not.toContain(option)
    }
  })

  it('odd: a group, seven of its words and three from other groups to find', () => {
    for (const seed of [1, 2, 3]) {
      const { prompts, options, answers } = pickRound(firstTurn({ play: 'odd', twoWay: false }, seed))
      const group = prompts[0]
      const groupOf = (front: string) => themes.find((pair) => pair.front === front)!.back
      expect([prompts.length, options.length, answers.length]).toEqual([1, 10, 3])
      for (const [index, option] of options.entries()) expect(groupOf(option) === group, option).toBe(!answers.includes(index))
    }
  })

  it('pick: tiles toggle, never more than three, Check only with three, and a point for each right one', () => {
    const turn = firstTurn({ play: 'match', cards: 2 })
    const { answers, options } = pickRound(turn)
    const wrong = options.findIndex((_, i) => !answers.includes(i))
    expect(play(turn, { type: 'pick', index: answers[0] }, { type: 'pick', index: answers[0] }).context.turn.picked).toEqual([])
    const three = play(turn, ...answers.map((index): Event => ({ type: 'pick', index })))
    expect(play(three, { type: 'pick', index: wrong }).context.turn.picked).toEqual(answers)
    expect(play(turn, { type: 'pick', index: answers[0] }, { type: 'check' }).phase).toBe('turn')
    for (const index of [-1, 10, 1.5]) expect(play(turn, { type: 'pick', index })).toEqual(turn)

    const scored = pickAndCheck(turn, true)
    expect([scored.phase, scored.context.turn.results]).toEqual(['reveal', [2]])
    const next = play(scored, { type: 'continue' })
    expect([next.phase, next.context.turn.picked]).toEqual(['turn', []])
    const done = play(pickAndCheck(next), { type: 'continue' })
    expect([done.phase, points(done)]).toEqual(['turn_summary', 5])
  })

  it('ignores events for the other way of playing, and ends the turn when time runs out, from a card or a result', () => {
    const flip = firstTurn()
    expect(play(flip, { type: 'pick', index: 0 }, { type: 'check' })).toEqual(flip)
    expect(play(flip, { type: 'knew' })).toEqual(flip) // not flipped yet
    const match = firstTurn({ play: 'match' })
    expect(play(match, { type: 'flip' })).toEqual(match)
    expect(play(match, { type: 'time_up' }).phase).toBe('turn_summary')
    expect(play(flip, { type: 'flip' }, { type: 'time_up' }).phase).toBe('turn_summary')
  })

  it('plays a whole game of Free Play flip cards: ten known cards, then the score', () => {
    const config = PairsConfig.parse({ teams: ['You'], solo: true, timer: false, rounds: 1, packs: ['francais-anglais'] })
    let state = play(start(machine, { input: { config, items: itemsFor(config) }, seed: 2026 }), { type: 'start' })
    expect(state.context.turnEndsAt).toBeNull()
    for (let card = 0; card < 10; card++) state = play(state, { type: 'flip' }, { type: 'knew' })
    state = play(state, { type: 'next' })
    expect(isFinal(machine, state)).toBe(true)
    expect(state.context.scores).toEqual([10])
  })

  it('dealRound: the same seed deals the same round, and match draws its prompts from the pool so they don’t repeat', () => {
    const config = configWith({ play: 'match' })
    const pool = newPool(words.slice(1), createRng(3))
    const deal = (seed: number) => dealRound(words[0], pool, config, createRng(seed))
    expect(deal(9)).toEqual(deal(9))
    expect(deal(9).pool.drawn).toHaveLength(2)
  })
})

describe('Pairs guards', () => {
  const base = firstTurn({ play: 'match' }).context

  it('canPick and allPicked follow the round’s tiles and how many are picked', () => {
    const canPick = (picked: number[], index: number) => machine.guards.canPick({ context: { ...base, turn: { ...base.turn, picked } }, event: { type: 'pick', index } })
    expect([canPick([], 0), canPick([0, 1, 2], 3), canPick([0, 1, 2], 2), canPick([], 10)]).toEqual([true, false, true, false])
    const allPicked = (picked: number[]) => machine.guards.allPicked({ context: { ...base, turn: { ...base.turn, picked } }, event: { type: 'check' } })
    expect([allPicked([0, 1]), allPicked([0, 1, 2])]).toEqual([false, true])
  })
})
