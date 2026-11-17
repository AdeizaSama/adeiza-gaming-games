import { checkPack, type PackProblem } from '../../src/sdk/content/loadPacks'
import { checkTheme } from '../../src/sdk/theme/loadThemes'
import type { GameSchema } from './gameSchema'
import { schemaFileName, themeSchemaFileName } from './jsonSchema'

/** What checking one pack file found: how many items it has (when it's valid) and what's wrong with it. */
export interface PackFileReport {
  items: number | null
  problems: PackProblem[]
}

/** The `$schema` value a pack in `src/games/<game>/content/` must have, if it has one. */
export function expectedSchemaLink(gameId: string): string {
  return `../../../../schemas/${schemaFileName(gameId)}`
}

/**
 * Adds the item's text to a problem inside an item, so contributors can find it: `items.3` becomes
 * `items.3 ("Goku")`. Uses the game's item key; if the item is too broken to have one, the path stays as it is.
 */
function withItemName(path: string, data: unknown, schema: GameSchema): string {
  const match = /^items\.(\d+)(.*)$/.exec(path)
  if (!match) return path
  try {
    const item = (data as { items: unknown[] }).items[Number(match[1])]
    const key = schema.itemKey(item)
    return typeof key === 'string' && key.trim() !== '' ? `items.${match[1]} ("${key}")${match[2]}` : path
  } catch {
    return path
  }
}

/**
 * Checks one pack file's text, as the content check in CI does:
 *
 * 1. It's valid JSON. If not, nothing else can be checked.
 * 2. Its `$schema`, if present, points at its game's JSON Schema. A wrong path silently turns off editor help.
 * 3. `checkPack` from the SDK, the same check the app runs.
 */
export function checkPackFile(gameId: string, file: string, text: string, schema: GameSchema): PackFileReport {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (error) {
    return { items: null, problems: [{ path: '', message: `Not valid JSON: ${(error as Error).message}` }] }
  }

  const problems: PackProblem[] = []

  const link = (data as { $schema?: unknown } | null)?.$schema
  if (link !== undefined && link !== expectedSchemaLink(gameId)) {
    problems.push({ path: '$schema', message: `Should be "${expectedSchemaLink(gameId)}"` })
  }

  const result = checkPack(file, data, schema.itemSchema, schema.itemKey)
  if (!result.ok) problems.push(...result.problems)

  return {
    items: problems.length === 0 && result.ok ? result.pack.items.length : null,
    problems: problems.map((problem) => ({ ...problem, path: withItemName(problem.path, data, schema) })),
  }
}

/** The `$schema` value a theme in `src/themes/` must have, if it has one. */
export const expectedThemeSchemaLink = `../../schemas/${themeSchemaFileName}`

/**
 * Checks one theme file's text, as the content check in CI does: valid JSON, the right `$schema` link if it has
 * one, and `checkTheme` from the SDK, the same check the app runs.
 */
export function checkThemeFile(file: string, text: string): PackProblem[] {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (error) {
    return [{ path: '', message: `Not valid JSON: ${(error as Error).message}` }]
  }

  const problems: PackProblem[] = []
  const link = (data as { $schema?: unknown } | null)?.$schema
  if (link !== undefined && link !== expectedThemeSchemaLink) {
    problems.push({ path: '$schema', message: `Should be "${expectedThemeSchemaLink}"` })
  }
  const result = checkTheme(file, data)
  if (!result.ok) problems.push(...result.problems)
  return problems
}
