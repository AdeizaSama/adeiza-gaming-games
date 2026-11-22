import { describe, expect, expectTypeOf, it } from 'vitest'
import { z } from 'zod'
import type { Pack } from '../content/pack'
import type { Variant } from '../content/variant'
import { TeamTurnsConfig } from '../formats/team-turns/config'
import { teamTurns } from '../formats/team-turns/teamTurns'
import { teamTurnsViews, type TeamTurnsViewProps } from '../formats/team-turns/views'
import { defineGame, type GameMeta } from './defineGame'
import type { SettingsViewProps } from './settings'

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

// Views only need to exist for these tests; they're never drawn.
type Props = TeamTurnsViewProps<Item, { got: number }, { type: 'got' }>
const TurnView = (props: Props) => props.context.item?.text ?? null
const SummaryView = (props: Props) => props.points(props.context.turn, props.context.config)

/** A variant of Word Duel: the food pack, 30-second turns, rounds open. */
function variant(id: string, changes: Partial<Variant> = {}): Variant {
  return { id, name: 'Quick Food', tagline: 'Food, fast.', categories: ['party'], packs: ['food'], tags: [], settings: { seconds: 30 }, open: ['rounds'], freePlay: false, contributors: ['AdeizaSama'], ...changes }
}

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
  config: { schema: TeamTurnsConfig },
  rules: '## A turn\n\nGuess the word.',
  variants: [variant('quick-food')],
  machine,
  views: { turn: TurnView },
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
  it('returns the game with the format’s default views filled in', () => {
    const defined = defineGame(game)
    expect(defined.machine).toBe(game.machine)
    expect(defined.views).toEqual({ ...teamTurnsViews, turn: TurnView })
  })

  it('uses a game’s own view for a format phase instead of the default', () => {
    expect(defineGame({ ...game, views: { turn: TurnView, turn_summary: SummaryView } }).views.turn_summary).toBe(SummaryView)
  })

  it('needs rules, in the markdown the rules screen can show', () => {
    expect(problemsWith({ rules: '  ' })).toContain('rules: Write how to play')
    expect(problemsWith({ rules: 'Fine\n\n| a | b |' })).toContain('rules: Line 3: tables aren’t supported; use a list')
  })

  it('reports a phase without a view', () => {
    expect(problemsWith({ views: {} })).toContain('views: Phase "turn" has no view')
  })

  it('accepts a game without variants, and gives it an empty list', () => {
    expect(defineGame({ ...game, variants: undefined }).variants).toEqual([])
    expect(defineGame(game).variants.map((v) => v.id)).toEqual(['quick-food'])
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

  it('checks a variant’s settings against the game’s config schema', () => {
    expect(problemsWith({ variants: [variant('quick-food', { settings: { seconds: 5 } })] })).toContain('variants.0.settings.seconds:')
  })

  it('reports a variant that names a pack the game does not have', () => {
    expect(problemsWith({ variants: [variant('quick-food', { packs: ['anime'] })] })).toContain('variants.0.packs: No pack with id "anime"')
  })

  it('reports a variant that opens a setting there isn’t, or opens or sets teams, packs or tags', () => {
    const message = problemsWith({ variants: [variant('quick-food', { open: ['rounds', 'speed', 'packs'], settings: { tags: ['fruit'] } })] })
    expect(message).toContain('variants.0.open: "speed" isn\'t a setting players can change. Pick from: rounds, seconds')
    expect(message).toContain('variants.0.open: "packs" isn\'t a setting players can change')
    expect(message).toContain('variants.0.settings.tags: Set tags at the top of the file, not in settings')
  })

  it('reports a variant offering Free Play in a game that has none, and accepts one in a game that does', () => {
    expect(problemsWith({ variants: [variant('quick-food', { freePlay: true })] })).toContain('variants.0.freePlay: Word Duel can\'t be played alone: it has no Free Play')
    const freePlay = { view: () => null, settings: { seconds: 30 } }
    expect(problemsWith({ config: { ...game.config, freePlay }, variants: [variant('quick-food', { freePlay: true })] })).toBeUndefined()
    expect(problemsWith({ config: { ...game.config, freePlay: { ...freePlay, settings: { seconds: 5 } } }, variants: [variant('quick-food', { freePlay: true })] })).toContain(
      'variants.0.freePlay.seconds:',
    )
  })

  it('reports two variants with the same id, and an id a page of the game already uses', () => {
    const message = problemsWith({ variants: [variant('quick-food'), variant('quick-food'), variant('rules')] })
    expect(message).toContain('variants.1.id: "quick-food" is already used by another variant')
    expect(message).toContain('variants.2.id: "rules" is taken: the game\'s rules page uses it')
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
      // @ts-expect-error: only the team-turns format exists so far
      meta: { ...meta, format: 'host-led' },
    }),
  () =>
    defineGame({
      ...game,
      // @ts-expect-error: the game's `turn` phase has no view
      views: { turn_summary: SummaryView },
    }),
  () =>
    defineGame({
      ...game,
      // @ts-expect-error: the machine has no `steal` phase
      views: { turn: TurnView, steal: TurnView },
    }),
  () =>
    defineGame({
      ...game,
      // @ts-expect-error: a view written for another game's items
      views: { turn: (props: TeamTurnsViewProps<{ word: string }, { got: number }, { type: 'got' }>) => props.context.item?.word ?? null },
    }),
  () =>
    defineGame({
      ...game,
      config: {
        schema: TeamTurnsConfig,
        // @ts-expect-error: a settings view for a setting this game doesn't have
        view: (props: SettingsViewProps<TeamTurnsConfig & { mode: 'describe' | 'mix' }>) => props.settings.mode,
      },
    }),
]
