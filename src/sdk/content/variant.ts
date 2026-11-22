/**
 * Variants (ADR 0018): a game with set content and settings, in a JSON file in the game's `variants/` folder. What
 * the home page lists. Scripts load this file on its own (the content check), so it imports only zod and the SDK's
 * content helpers.
 */
import { z } from 'zod'
import { categories } from './categories'
import { friendlyError } from './messages'
import { PackInfo, Tag } from './pack'

/**
 * The shape of a variant file. Whether its settings, packs and open settings fit its game is checked by `defineGame`,
 * which knows the game.
 */
export const VariantFile = z.strictObject({
  $schema: z.string().optional().meta({ description: 'Lets your editor check this file and suggest fields. Leave it as it is.' }),
  id: PackInfo.shape.id.meta({ description: 'Must match the file name: "naija-back-to-school" for naija-back-to-school.json.' }),
  name: z
    .string()
    .trim()
    .min(1)
    .max(60, 'Keep the name to 60 characters: it goes on the home page')
    .meta({ description: 'What players see on the home page, e.g. "Naija Charades (Back to School Edition)".' }),
  tagline: z
    .string()
    .trim()
    .min(1)
    .max(100, 'Keep the tagline to 100 characters')
    .meta({ description: 'One line under the name on the home page.' }),
  categories: z
    .array(z.enum(categories.map(({ id }) => id) as [string, ...string[]]))
    .min(1, 'List at least one category')
    .refine((ids) => new Set(ids).size === ids.length, 'List each category once')
    .meta({ description: 'What kind of game it is, for the filter on Browse (ADR 0021), e.g. ["party", "naija"]. From src/sdk/content/categories.json.' }),
  packs: z
    .array(PackInfo.shape.id)
    .min(1, 'List at least one pack')
    .meta({ description: 'The ids of the game\'s packs to play, e.g. ["back-to-school"].' }),
  tags: z
    .array(Tag)
    .default([])
    .meta({ description: 'Optional. Only play items with at least one of these tags. Leave out to play every item.' }),
  settings: z
    .record(z.string(), z.unknown())
    .default({})
    .meta({ description: 'The settings that differ from the game\'s defaults, e.g. { "mode": "clock", "seconds": 90 }.' }),
  open: z
    .array(z.string())
    .default([])
    .meta({ description: 'The settings players may change, e.g. ["rounds", "seconds", "mode"]. Teams are always open.' }),
  freePlay: z
    .boolean()
    .default(false)
    .meta({ description: 'Optional. true: players can also play it alone, in Free Play (ADR 0019), if its game allows that.' }),
  contributors: PackInfo.shape.contributors,
})

export type Variant = z.output<typeof VariantFile>

/** One thing wrong with a variant file. `path` says where, e.g. `"settings"`; empty means the whole file. */
export interface VariantProblem {
  path: string
  message: string
}

export type VariantCheck = { ok: true; variant: Variant } | { ok: false; problems: VariantProblem[] }

/** The id a file must have: its name without folders or `.json`. */
function idFromFile(file: string): string {
  return file.split(/[\\/]/).at(-1)!.replace(/\.json$/, '')
}

/**
 * Checks one variant file's shape, and that its `id` is its file name. The app (`loadVariants`) and the content check
 * in CI both use it.
 */
export function checkVariant(file: string, data: unknown): VariantCheck {
  const parsed = VariantFile.safeParse(data, { error: friendlyError })
  if (!parsed.success) {
    return { ok: false, problems: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })) }
  }
  const expected = idFromFile(file)
  if (parsed.data.id !== expected) {
    return { ok: false, problems: [{ path: 'id', message: `The id must match the file name: "${expected}" (found "${parsed.data.id}")` }] }
  }
  return { ok: true, variant: parsed.data }
}

/**
 * Loads a game's variants from the files Vite finds, checking each one, sorted by id:
 *
 *   loadVariants(import.meta.glob('./variants/*.json', { eager: true, import: 'default' }))
 *
 * Throws one error listing every problem in every file, like `loadPacks`.
 */
export function loadVariants(files: Record<string, unknown>): Variant[] {
  const variants: Variant[] = []
  const problems: string[] = []
  for (const [file, data] of Object.entries(files)) {
    const result = checkVariant(file, data)
    if (result.ok) variants.push(result.variant)
    else problems.push(...result.problems.map((problem) => `${file}, ${problem.path || 'whole file'}: ${problem.message}`))
  }
  if (problems.length > 0) throw new Error(`Variants have problems:\n${problems.map((problem) => `  ${problem}`).join('\n')}`)
  return variants.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}
