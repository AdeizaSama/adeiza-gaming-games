import { z } from 'zod'
import type { ItemKey } from '../content/duplicates'
import { PackInfo, Tag, type Pack } from '../content/pack'
import type { Variant } from '../content/variant'
import type { MachineEvent } from '../machine/types'
import type { TeamTurnsConfig } from '../formats/team-turns/config'
import type { TeamTurnsMachine, TeamTurnsPhase } from '../formats/team-turns/teamTurns'
import { teamTurnsViews, type TeamTurnsView } from '../formats/team-turns/views'
import { parseMarkdown } from '../interactions/markdown'
import { checkVariantSettings, freePlaySettings, openableSettings, type FreePlay, type SettingsView } from './settings'

/** What the library shows about a game (standard §3). Checked when the game is defined. */
export const GameMeta = z.strictObject({
  /** Permanent: saved games and links use it. */
  id: PackInfo.shape.id,
  name: z.string().trim().min(1),
  tagline: z.string().trim().min(1),
  /** An icon name from the shared icon set. */
  icon: z.string().trim().min(1),
  /** Only `team-turns` exists so far (standard §7). */
  format: z.literal('team-turns'),
  players: z
    .strictObject({ min: z.int().min(2), max: z.int() })
    .refine(({ min, max }) => max >= min, 'max must be at least min'),
  complexity: z.int().min(1).max(5),
  tags: z.array(Tag),
  /** GitHub usernames of the game's creators. */
  contributors: PackInfo.shape.contributors,
})

export type GameMeta = z.infer<typeof GameMeta>

/** Addresses a game already uses (`/:gameId/play`, `/:gameId/rules`), so no variant can have them as its id. */
const takenIds = new Set(['play', 'rules'])

/**
 * The views a game lists (ADR 0005): one for each of its own phases, required, and optionally its own for any of the
 * format's phases, replacing the format's default.
 */
export type GameViews<Item, Turn, Event extends MachineEvent, Config extends TeamTurnsConfig, Phase extends string> =
  Record<Phase, TeamTurnsView<Item, Turn, Event, Config>> &
    Partial<Record<TeamTurnsPhase, TeamTurnsView<Item, Turn, Event, Config>>>

/** Everything about one game (standard §3), as a game writes it. */
export interface GameDefinition<
  Item,
  Config extends TeamTurnsConfig,
  Setup,
  Turn,
  Event extends MachineEvent,
  Phase extends string,
  GuardName extends string,
  ActionName extends string,
> {
  meta: GameMeta
  content: {
    /** One content item, from the game's `schema.ts`. */
    itemSchema: z.ZodType<Item>
    /** What makes two items the same, from the game's `schema.ts`. The item pool uses it too. */
    itemKey: ItemKey<Item>
    /** Every pack, from `loadPacks`. */
    packs: Pack<Item>[]
  }
  config: {
    /** The settings players choose, with defaults: `TeamTurnsConfig`, or the game's extension of it. */
    schema: z.ZodType<Config, Setup>
    /**
     * The game's own settings on the setup screen (ADR 0008), below the format's. Leave it out if the game has none.
     * `NoInfer`, like `views`: it's checked against the schema's settings.
     */
    view?: NoInfer<SettingsView<Config>>
    /**
     * Lets the game's variants offer Free Play, one player alone (ADR 0019): the Free Play settings view, and where
     * Free Play starts. Leave out for a game that can't be played alone.
     */
    freePlay?: NoInfer<FreePlay<Config>>
  }
  /**
   * How to play, for players: the game's `rules.md`, imported with `?raw`. Written in the small part of markdown
   * `parseMarkdown` supports (ADR 0009).
   */
  rules: string
  /** The ways to play it the home page lists (ADR 0018), from `loadVariants`. Leave out if it has none yet. */
  variants?: Variant[]
  machine: TeamTurnsMachine<Item, Turn, Event, Config, Phase, GuardName, ActionName>
  /**
   * One view per phase. `NoInfer`: the types come from the rest of the game, and the views are checked against
   * them, so a view for the wrong items or a phase that doesn't exist is an error on the view.
   */
  views: NoInfer<GameViews<Item, Turn, Event, Config, Phase>>
}

/** A defined game: as written, but with a view for every phase, the format's defaults filled in. */
export type Game<
  Item,
  Config extends TeamTurnsConfig,
  Setup,
  Turn,
  Event extends MachineEvent,
  Phase extends string,
  GuardName extends string,
  ActionName extends string,
> = Omit<GameDefinition<Item, Config, Setup, Turn, Event, Phase, GuardName, ActionName>, 'views' | 'variants'> & {
  views: Record<TeamTurnsPhase | Phase, TeamTurnsView<Item, Turn, Event, Config>>
  variants: Variant[]
}

/**
 * Defines a game: the single export of `src/games/<id>/index.ts`.
 *
 * Checks what TypeScript can't, and throws one error listing every problem, so a broken game fails its tests and
 * never reaches players:
 * - `meta` follows the rules above.
 * - There's at least one pack.
 * - Each variant (ADR 0018) has a unique id that isn't `play` or `rules`, names only packs that exist, has settings
 *   that pass the config schema, opens only real settings (never teams, packs or tags), and offers Free Play only if
 *   the game does, with settings that pass the schema too (ADR 0019).
 * - The rules aren't empty, and use only the markdown `parseMarkdown` supports.
 * - Every phase of the machine has a view.
 *
 * Returns the game with the format's default views filled in for any format phase the game didn't list, and an
 * empty list of variants if it has none.
 */
export function defineGame<
  Item,
  Config extends TeamTurnsConfig,
  Setup,
  Turn,
  Event extends MachineEvent,
  Phase extends string,
  GuardName extends string,
  ActionName extends string,
>(
  game: GameDefinition<Item, Config, Setup, Turn, Event, Phase, GuardName, ActionName>,
): Game<Item, Config, Setup, Turn, Event, Phase, GuardName, ActionName> {
  const problems: string[] = []
  const report = (path: string, message: string) => problems.push(`${path}: ${message}`)

  const meta = GameMeta.safeParse(game.meta)
  if (!meta.success) {
    for (const issue of meta.error.issues) report(['meta', ...issue.path].join('.'), issue.message)
  }

  if (game.content.packs.length === 0) report('content.packs', 'A game needs at least one pack')

  const packIds = new Set(game.content.packs.map((pack) => pack.id))
  const variants = game.variants ?? []
  const variantIds = new Set<string>()
  // Any pack id will do: only the names of the settings are read. A stand-in keeps a game without packs reportable.
  const openable = new Set(openableSettings(game.config.schema, [game.content.packs[0]?.id ?? 'placeholder']))

  for (const [index, variant] of variants.entries()) {
    const at = `variants.${index}`
    if (variantIds.has(variant.id)) report(`${at}.id`, `"${variant.id}" is already used by another variant`)
    if (takenIds.has(variant.id)) report(`${at}.id`, `"${variant.id}" is taken: the game's ${variant.id} page uses it`)
    variantIds.add(variant.id)

    for (const pack of variant.packs) {
      if (!packIds.has(pack)) report(`${at}.packs`, `No pack with id "${pack}"`)
    }
    for (const name of ['teams', 'packs', 'tags']) {
      if (name in variant.settings) report(`${at}.settings.${name}`, `Set ${name === 'teams' ? 'teams on setup' : `${name} at the top of the file`}, not in settings`)
    }
    for (const name of variant.open) {
      if (!openable.has(name)) report(`${at}.open`, `"${name}" isn't a setting players can change. Pick from: ${[...openable].join(', ')}`)
    }
    const settings = checkVariantSettings(game.config.schema, variant)
    if (!settings.success) {
      for (const issue of settings.error.issues) report([`${at}.settings`, ...issue.path].join('.'), issue.message)
    }
    if (variant.freePlay && !game.config.freePlay) {
      report(`${at}.freePlay`, `${String(game.meta.name)} can't be played alone: it has no Free Play`)
    } else if (variant.freePlay && game.config.freePlay && settings.success) {
      try {
        freePlaySettings(game.config.schema, variant, game.config.freePlay)
      } catch (error) {
        for (const issue of (error as z.ZodError).issues ?? []) report([`${at}.freePlay`, ...issue.path].join('.'), issue.message)
      }
    }
  }

  if (game.rules.trim() === '') report('rules', 'Write how to play')
  for (const problem of parseMarkdown(game.rules).problems) report('rules', problem)

  const views = { ...teamTurnsViews, ...game.views } as Game<Item, Config, Setup, Turn, Event, Phase, GuardName, ActionName>['views']
  for (const phase of Object.keys(game.machine.phases)) {
    if (!(phase in views)) report('views', `Phase "${phase}" has no view`)
  }

  if (problems.length > 0) {
    throw new Error(`Game "${String(game.meta.id)}" has problems:\n${problems.map((p) => `  ${p}`).join('\n')}`)
  }
  return { ...game, views, variants }
}
