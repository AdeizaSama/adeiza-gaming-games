import { drawFrom, type ItemPool } from '../../sdk/formats/team-turns/pool'
import { teamTurns } from '../../sdk/formats/team-turns/teamTurns'
import type { Rng } from '../../sdk/rng'
import type { PairsConfig } from './config'
import type { PairsItem } from './schema'

/** How many tiles a match-up or odd-one-out round shows, and how many of them to find. */
export const tileCount = 10
export const findCount = 3

/**
 * What's on screen in one round (ADR 0020):
 * - `flip`: a card, `front` shown first, `back` after the flip.
 * - `pick`: tiles to pick from: `prompts` (three words for match-up, a group for odd-one-out), `options` (the
 *   tiles), and `answers` (the right tiles, by position).
 */
export type PairsRound = { kind: 'flip'; front: string; back: string } | { kind: 'pick'; prompts: string[]; options: string[]; answers: number[] }

/**
 * One turn: the round on screen, the tiles picked in it, whether its answer is showing (the card flipped, the tiles
 * checked), and the points of each round played, in order. Kept so a refresh shows the same thing; `results` counts
 * the rounds played.
 */
export interface PairsTurn {
  round: PairsRound | null
  picked: number[]
  revealed: boolean
  results: number[]
}

/** Sent by the views: flip the card and say if you knew it; or pick tiles, check, and go on. */
export type PairsEvent =
  | { type: 'flip' }
  | { type: 'knew' }
  | { type: 'not_yet' }
  | { type: 'pick'; index: number }
  | { type: 'check' }
  | { type: 'continue' }

/** Text compared as players read it: capitals and spaces don't make two tiles different. */
const same = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase()

/** The values of `list` with no two the same (by `same`), first ones kept. */
function distinct(list: readonly string[]): string[] {
  const seen = new Set<string>()
  return list.filter((value) => {
    if (seen.has(same(value))) return false
    seen.add(same(value))
    return true
  })
}

/** Every item in the pool, drawn or not. */
const everyItem = <Item,>(pool: ItemPool<Item>) => [...pool.remaining, ...pool.drawn]

/** Puts the right tiles and the others in a random order, and says where the right ones went. */
function tiles(right: string[], others: string[], rng: Rng): { options: string[]; answers: number[] } {
  const options = rng.shuffle([...right, ...others])
  const rightSet = new Set(right.map(same))
  return { options, answers: options.flatMap((option, index) => (rightSet.has(same(option)) ? [index] : [])) }
}

/**
 * Deals a round, from the item the format just drew and, for match-up, two more drawn from the pool, so prompts don't
 * repeat. The other tiles come from every item: never one written the same way as a right tile, so a right pick is
 * never marked wrong. With `twoWay`, a coin flip decides which side players see first.
 */
export function dealRound(item: PairsItem, pool: ItemPool<PairsItem>, config: Pick<PairsConfig, 'play' | 'twoWay'>, rng: Rng) {
  const flipped = config.twoWay && rng.next() < 0.5
  const shown = (pair: PairsItem) => (flipped ? pair.back : pair.front)
  const hidden = (pair: PairsItem) => (flipped ? pair.front : pair.back)
  const all = everyItem(pool)

  if (config.play === 'flip') return { pool, round: { kind: 'flip', front: shown(item), back: hidden(item) } satisfies PairsRound }

  if (config.play === 'match') {
    let current = pool
    const prompts = [item]
    while (prompts.length < findCount && prompts.length < all.length) {
      const next = drawFrom(current, rng)
      current = next.pool
      if (!prompts.some((prompt) => same(prompt.front) === same(next.item.front))) prompts.push(next.item)
    }
    const right = prompts.map(hidden)
    const others = rng.shuffle(distinct(all.map(hidden)).filter((text) => !right.some((answer) => same(answer) === same(text))))
    return { pool: current, round: { kind: 'pick', prompts: prompts.map(shown), ...tiles(right, others.slice(0, tileCount - right.length), rng) } satisfies PairsRound }
  }

  // Odd-one-out: the drawn item's group, seven of its words, and three words from other groups to find.
  const group = item.back
  const members = [item.front, ...rng.shuffle(all.filter((pair) => pair.back === group && same(pair.front) !== same(item.front)).map((pair) => pair.front))]
  const inside = distinct(members).slice(0, tileCount - findCount)
  const outside = rng
    .shuffle(distinct(all.filter((pair) => same(pair.back) !== same(group)).map((pair) => pair.front)))
    .filter((front) => !inside.some((member) => same(member) === same(front)))
    .slice(0, findCount)
  return { pool, round: { kind: 'pick', prompts: [group], ...tiles(outside, inside, rng) } satisfies PairsRound }
}

/** True while the turn has another round to come, once `played` rounds are done. */
const more = (played: number, config: Pick<PairsConfig, 'cards'>) => played < config.cards

/**
 * Pairs on the team-turns format (ADR 0004, 0020). The format runs the handoff, timer, pool, turn summary, scores and
 * results (and Free Play, ADR 0019); this is the turn.
 *
 * - When a turn starts, the format draws an item and `deal` makes a round of it.
 * - Flip: `flip` shows the back (`reveal`); `knew` or `not_yet` scores it and deals the next card, or ends the turn.
 * - Match, odd: `pick` turns a tile on or off; `check` scores the picks (`reveal`); `continue` deals the next round,
 *   or ends the turn.
 * - `time_up` ends the turn. A turn is worth the points of its rounds: 1 per Knew it, or 1 per right tile.
 */
export const machine = teamTurns<PairsItem, PairsTurn, PairsEvent, PairsConfig>()({
  newTurn: () => ({ round: null, picked: [], revealed: false, results: [] }),
  points: (turn) => turn.results.reduce((sum, points) => sum + points, 0),
  onStart: ['deal'],
  phases: {
    turn: {
      interaction: 'pairs',
      on: {
        flip: { when: 'isFlip', to: 'reveal', actions: ['reveal'] },
        pick: { when: 'canPick', actions: ['togglePick'] },
        check: { when: 'allPicked', to: 'reveal', actions: ['scorePicks', 'reveal'] },
        time_up: { to: 'turn_summary' },
      },
    },
    reveal: {
      interaction: 'pairs',
      on: {
        knew: [
          { when: 'anotherCard', to: 'turn', actions: ['markKnew', 'drawItem', 'deal'] },
          { when: 'isFlip', to: 'turn_summary', actions: ['markKnew'] },
        ],
        not_yet: [
          { when: 'anotherCard', to: 'turn', actions: ['markNotYet', 'drawItem', 'deal'] },
          { when: 'isFlip', to: 'turn_summary', actions: ['markNotYet'] },
        ],
        continue: [
          { when: 'anotherSet', to: 'turn', actions: ['drawItem', 'deal'] },
          { when: 'isPick', to: 'turn_summary' },
        ],
        time_up: { to: 'turn_summary' },
      },
    },
  },
  guards: {
    isFlip: ({ context }) => context.turn.round?.kind === 'flip',
    isPick: ({ context }) => context.turn.round?.kind === 'pick',
    /** On a flip card, with another to come after this one is marked. */
    anotherCard: ({ context }) => context.turn.round?.kind === 'flip' && more(context.turn.results.length + 1, context.config),
    /** On a set of tiles already scored, with another to come. */
    anotherSet: ({ context }) => context.turn.round?.kind === 'pick' && more(context.turn.results.length, context.config),
    /** A tile that can be turned on or off: on the board, and either picked already or with room for another. */
    canPick: ({ context, event }) => {
      const { round, picked } = context.turn
      if (event.type !== 'pick' || round?.kind !== 'pick' || !Number.isInteger(event.index)) return false
      if (event.index < 0 || event.index >= round.options.length) return false
      return picked.includes(event.index) || picked.length < round.answers.length
    },
    /** As many tiles picked as there are to find. */
    allPicked: ({ context }) => context.turn.round?.kind === 'pick' && context.turn.picked.length === context.turn.round.answers.length,
  },
  actions: {
    /** Makes a round of the item the format drew, with nothing picked. */
    deal: ({ context, rng }) => {
      const { pool, round } = dealRound(context.item!, context.pool, context.config, rng)
      return { ...context, pool, turn: { ...context.turn, round, picked: [], revealed: false } }
    },
    /** Shows the round's answer: the card's back, or which tiles were right. */
    reveal: ({ context }) => ({ ...context, turn: { ...context.turn, revealed: true } }),
    /** Turns the tile named by `pick` on, or off. */
    togglePick: ({ context, event }) => {
      if (event.type !== 'pick') return context
      const { picked } = context.turn
      return { ...context, turn: { ...context.turn, picked: picked.includes(event.index) ? picked.filter((i) => i !== event.index) : [...picked, event.index] } }
    },
    /** A point for each right tile picked. */
    scorePicks: ({ context }) => {
      const round = context.turn.round
      const right = round?.kind === 'pick' ? context.turn.picked.filter((index) => round.answers.includes(index)).length : 0
      return { ...context, turn: { ...context.turn, results: [...context.turn.results, right] } }
    },
    /** A point for a card players knew. */
    markKnew: ({ context }) => ({ ...context, turn: { ...context.turn, results: [...context.turn.results, 1] } }),
    /** No point for a card not known yet; it still counts as played. */
    markNotYet: ({ context }) => ({ ...context, turn: { ...context.turn, results: [...context.turn.results, 0] } }),
  },
})
