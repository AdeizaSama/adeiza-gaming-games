import { describe, expect, expectTypeOf, it } from 'vitest'
import { z } from 'zod'
import type { Pack } from '../content/pack'
import { TeamTurnsConfig } from '../formats/team-turns/config'
import { teamTurns } from '../formats/team-turns/teamTurns'
import { defineGame, type GameMeta } from './defineGame'

// A tiny team-turns game standing in for a real one: items are `{ text }`, one point per word got.
const itemSchema = z.strictObject({ text: z.string().min(1) })
type Item = z.infer<typeof itemSchema>

const machine = teamTurns<Item, { got: number }, { type: 'got' }>()({
  newTurn: () => ({ got: 0 }),
  points: (turn) => turn.got,
  phases: {
    turn: {
      interaction: 'flash_card',
      on: { got: { actions: ['markGot', 'drawItem'] }, time_up: { to: 'turn_summary' } },
    },
  },
  guards: {},
  actions: { markGot: ({ context }) => ({ ...context, turn: { got: context.turn.got + 1 } }) },
})

function pack(id: string): Pack<Item> {
  return { id, name: id, description: id, language: 'en', maturity: 'everyone', contributors: ['AdeizaSama'], items: [{ text: 'Sun' }] }
}

const meta: GameMeta = {
  id: 'word-duel',
  name: 'Word Duel',
  tagline: 'Guess the word.',
  icon: 'book',
  format: 'team-turns',
  players: { min: 2, max: 20 },
  complexity: 1,
  tags: ['party'],
  contributors: ['AdeizaSama'],
}

const game = {
  meta,
  content: { itemSchema, itemKey: (item: Item) => item.text, packs: [pack('animals'), pack('food')] },
  config: {
    schema: TeamTurnsConfig,
    presets: [{ id: 'quick', name: 'Quick game', contributors: ['AdeizaSama'], config: { rounds: 1, seconds: 30 }, packs: ['food'] }],
  },
  machine,
}

/** The error message `defineGame` throws for a game with some changes, or undefined if it doesn't throw. */
function problemsWith(changes: Record<string, unknown>): string | undefined {
  try {
    defineGame({ ...game, ...changes } as typeof game)
    return undefined
  } catch (error) {
    return (error as Error).message
  }
}

describe('defineGame', () => {
  it('returns a valid game unchanged', () => {
    expect(defineGame(game)).toBe(game)
  })

  it('accepts a game without presets', () => {
    expect(problemsWith({ config: { schema: TeamTurnsConfig } })).toBeUndefined()
  })

  it('reports problems in meta, with where each is', () => {
    const message = problemsWith({
      meta: { ...meta, id: 'Word Duel', complexity: 6, players: { min: 4, max: 2 }, contributors: [] },
    })
    expect(message).toContain('Game "Word Duel" has problems:')
    expect(message).toContain('meta.id:')
    expect(message).toContain('meta.complexity:')
    expect(message).toContain('meta.players: max must be at least min')
    expect(message).toContain('meta.contributors:')
  })

  it('needs at least one pack', () => {
    expect(problemsWith({ content: { ...game.content, packs: [] } })).toContain(
      'content.packs: A game needs at least one pack',
    )
  })

  it('checks a preset’s settings against the game’s config schema', () => {
    const presets = [{ ...game.config.presets[0], config: { seconds: 5 } }]
    expect(problemsWith({ config: { ...game.config, presets } })).toContain('config.presets.0.config.seconds:')
  })

  it('reports a preset that names a pack the game does not have', () => {
    const presets = [{ ...game.config.presets[0], packs: ['anime'] }]
    expect(problemsWith({ config: { ...game.config, presets } })).toContain('config.presets.0.packs: No pack with id "anime"')
  })

  it('reports two presets with the same id, and a preset without contributors', () => {
    const presets = [game.config.presets[0], { ...game.config.presets[0], contributors: [] }]
    const message = problemsWith({ config: { ...game.config, presets } })
    expect(message).toContain('config.presets.1.id: "quick" is already used by another preset')
    expect(message).toContain('config.presets.1.contributors:')
  })

  // Checked by `pnpm typecheck`; at runtime these lines do nothing.
  it('keeps the item and settings types from the schemas', () => {
    const defined = defineGame(game)
    expectTypeOf(defined.content.packs).toEqualTypeOf<Pack<Item>[]>()
    expectTypeOf<ReturnType<typeof defined.config.schema.parse>>().toEqualTypeOf<TeamTurnsConfig>()
  })
})

// Mistakes that must be type errors. Each is wrapped in a function that never runs: defineGame checks at runtime
// too, and would throw.
const otherItems = teamTurns<{ word: string }, { got: number }, { type: 'got' }>()({
  newTurn: () => ({ got: 0 }),
  points: (turn) => turn.got,
  phases: { turn: { interaction: 'flash_card', on: { time_up: { to: 'turn_summary' } } } },
  guards: {},
  actions: {},
})

export const mistakes = [
  () =>
    defineGame({
      ...game,
      // @ts-expect-error: the machine plays `{ word }` items, but the packs hold `{ text }` items
      machine: otherItems,
    }),
  () =>
    defineGame({
      ...game,
      config: {
        schema: TeamTurnsConfig,
        // @ts-expect-error: presets never set the teams; players name their own
        presets: [{ id: 'x', name: 'X', contributors: ['AdeizaSama'], config: { teams: ['A', 'B'] }, packs: ['food'] }],
      },
    }),
  () =>
    defineGame({
      ...game,
      // @ts-expect-error: only the team-turns format exists so far
      meta: { ...meta, format: 'host-led' },
    }),
]
