import type { z } from 'zod'
import { findDuplicates, type ItemKey } from './duplicates'
import { packSchema, type Pack } from './pack'

/** One thing wrong with a pack. `path` says where, e.g. `"items.2.text"`; empty means the whole file. */
export interface PackProblem {
  path: string
  message: string
}

/** The result of checking one pack file: the pack, or everything wrong with it. */
export type PackCheck<Item> = { ok: true; pack: Pack<Item> } | { ok: false; problems: PackProblem[] }

/** The pack id a file must have: its name without folders or `.json`. Accepts `/` and `\` so it works on Windows too. */
function idFromFile(file: string): string {
  return file.split(/[\\/]/).at(-1)!.replace(/\.json$/, '')
}

/**
 * Checks one pack file. The only place that decides whether a pack is valid: the app (`loadPacks`) and the
 * content check in CI both use it, so they can never disagree.
 *
 * 1. The pack matches the pack schema, with items matching the game's item schema.
 * 2. Its `id` is its file name (`anime.json` → `"anime"`). File names are unique in a folder, so ids are too.
 * 3. No item is listed twice (compared by the game's item key).
 *
 * If step 1 fails, steps 2 and 3 are skipped: they need a pack whose shape is known.
 */
export function checkPack<ItemSchema extends z.ZodType>(
  file: string,
  data: unknown,
  itemSchema: ItemSchema,
  itemKey: ItemKey<z.output<ItemSchema>>,
): PackCheck<z.output<ItemSchema>> {
  const parsed = packSchema(itemSchema).safeParse(data)
  if (!parsed.success) {
    return {
      ok: false,
      problems: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    }
  }

  const pack: Pack<z.output<ItemSchema>> = parsed.data
  const problems: PackProblem[] = []

  const expectedId = idFromFile(file)
  if (pack.id !== expectedId) {
    problems.push({ path: 'id', message: `The id must match the file name: "${expectedId}" (found "${pack.id}")` })
  }

  for (const duplicate of findDuplicates(pack.items, itemKey)) {
    problems.push({
      path: `items.${duplicate.index}`,
      message: `"${duplicate.key}" is already in this pack at items.${duplicate.firstIndex}`,
    })
  }

  return problems.length === 0 ? { ok: true, pack } : { ok: false, problems }
}

/**
 * Loads a game's packs from the files Vite finds, checking each one. Returns the packs sorted by id.
 *
 *   loadPacks(import.meta.glob('./content/*.json', { eager: true, import: 'default' }), CharadesItem, itemKey)
 *
 * `eager: true` loads the files with the app instead of on demand; `import: 'default'` gives each file's JSON
 * directly. The result is an object from file path to contents, e.g. `{ './content/anime.json': { id: 'anime', … } }`.
 *
 * Throws one error listing every problem in every file. CI rejects invalid packs before they're merged,
 * so in practice this only fires while someone is editing a pack locally, and it should be loud.
 */
export function loadPacks<ItemSchema extends z.ZodType>(
  files: Record<string, unknown>,
  itemSchema: ItemSchema,
  itemKey: ItemKey<z.output<ItemSchema>>,
): Pack<z.output<ItemSchema>>[] {
  const packs: Pack<z.output<ItemSchema>>[] = []
  const problems: string[] = []

  for (const [file, data] of Object.entries(files)) {
    const result = checkPack(file, data, itemSchema, itemKey)
    if (result.ok) packs.push(result.pack)
    else problems.push(...result.problems.map((problem) => `${file}, ${problem.path || 'whole file'}: ${problem.message}`))
  }

  if (problems.length > 0) {
    throw new Error(`Content packs have problems:\n${problems.map((problem) => `  ${problem}`).join('\n')}`)
  }

  // Plain comparison, not localeCompare: ids are lowercase ASCII, and this gives the same order on every device.
  return packs.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}
