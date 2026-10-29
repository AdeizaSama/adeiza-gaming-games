import { z } from 'zod'
import type { ItemKey } from '../content/duplicates'
import { PackInfo, Tag, type Pack } from '../content/pack'
import type { MachineEvent } from '../machine/types'
import type { TeamTurnsConfig } from '../formats/team-turns/config'
import type { TeamTurnsMachine } from '../formats/team-turns/teamTurns'

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

/**
 * A named variant: settings and packs on top of the game's defaults (standard §1). Teams are never part of a
 * preset: players always name their own.
 */
export interface Preset<Setup> {
  id: string
  name: string
  contributors: string[]
  /** Settings that differ from the defaults, e.g. `{ seconds: 90 }`. */
  config: Partial<Omit<Setup, 'teams' | 'packs'>>
  /** Content pack ids. */
  packs: string[]
}

/** A preset's own fields; its settings are checked against the game's config schema. */
const PresetInfo = z.object({
  id: PackInfo.shape.id,
  name: z.string().trim().min(1),
  contributors: PackInfo.shape.contributors,
  packs: z.array(z.string()).min(1, 'List at least one pack'),
})

/**
 * Everything about one game (standard §3). Built in stages: views are added in chapter 04 and rules in
 * chapter 06, each as a required field once it exists.
 */
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
    presets?: Preset<Setup>[]
  }
  machine: TeamTurnsMachine<Item, Turn, Event, Config, Phase, GuardName, ActionName>
}

/**
 * Defines a game: the single export of `src/games/<id>/index.ts`.
 *
 * Checks what TypeScript can't, and throws one error listing every problem, so a broken game fails its tests and
 * never reaches players:
 * - `meta` follows the rules above.
 * - There's at least one pack.
 * - Each preset has a unique id, a name and contributors, only names packs that exist, and its settings pass the
 *   config schema.
 *
 * Returns the definition unchanged.
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
): GameDefinition<Item, Config, Setup, Turn, Event, Phase, GuardName, ActionName> {
  const problems: string[] = []
  const report = (path: string, message: string) => problems.push(`${path}: ${message}`)

  const meta = GameMeta.safeParse(game.meta)
  if (!meta.success) {
    for (const issue of meta.error.issues) report(['meta', ...issue.path].join('.'), issue.message)
  }

  if (game.content.packs.length === 0) report('content.packs', 'A game needs at least one pack')

  const packIds = new Set(game.content.packs.map((pack) => pack.id))
  const presetIds = new Set<string>()

  for (const [index, preset] of (game.config.presets ?? []).entries()) {
    const at = `config.presets.${index}`

    const info = PresetInfo.safeParse(preset)
    if (!info.success) {
      for (const issue of info.error.issues) report([at, ...issue.path].join('.'), issue.message)
    }

    if (presetIds.has(preset.id)) report(`${at}.id`, `"${preset.id}" is already used by another preset`)
    presetIds.add(preset.id)

    for (const pack of preset.packs) {
      if (!packIds.has(pack)) report(`${at}.packs`, `No pack with id "${pack}"`)
    }

    // Two placeholder teams stand in for the ones players will name, so only the preset's own settings are tested.
    const settings = game.config.schema.safeParse({ ...preset.config, teams: ['Team 1', 'Team 2'], packs: preset.packs })
    if (!settings.success) {
      for (const issue of settings.error.issues) report([`${at}.config`, ...issue.path].join('.'), issue.message)
    }
  }

  if (problems.length > 0) {
    throw new Error(`Game "${String(game.meta.id)}" has problems:\n${problems.map((p) => `  ${p}`).join('\n')}`)
  }
  return game
}
