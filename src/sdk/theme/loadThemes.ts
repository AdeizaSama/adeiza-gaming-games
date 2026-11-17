import { friendlyError } from '../content/messages'
import type { PackProblem } from '../content/loadPacks'
import { themeSchema, type Theme } from './schema'

/** The result of checking one theme file: the theme, or everything wrong with it. */
export type ThemeCheck = { ok: true; theme: Theme } | { ok: false; problems: PackProblem[] }

/**
 * Checks one theme file: it matches the theme schema, and its `id` is its file name. The app (`loadThemes`) and the
 * content check in CI both use it, like `checkPack` for packs. Contrast is checked separately (`checkContrast`).
 */
export function checkTheme(file: string, data: unknown): ThemeCheck {
  const parsed = themeSchema.safeParse(data, { error: friendlyError })
  if (!parsed.success) {
    return { ok: false, problems: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })) }
  }
  const expectedId = file.split(/[\\/]/).at(-1)!.replace(/\.json$/, '')
  if (parsed.data.id !== expectedId) {
    return { ok: false, problems: [{ path: 'id', message: `The id must match the file name: "${expectedId}" (found "${parsed.data.id}")` }] }
  }
  return { ok: true, theme: parsed.data }
}

/**
 * Loads the theme files Vite finds, checking each one, and returns them sorted by id:
 *
 *   loadThemes(import.meta.glob('../../themes/*.json', { eager: true, import: 'default' }))
 *
 * Throws one error listing every problem in every file, like `loadPacks`. CI rejects broken themes before they're
 * merged, so in practice this only fires while someone is editing a theme locally.
 */
export function loadThemes(files: Record<string, unknown>): Theme[] {
  const themes: Theme[] = []
  const problems: string[] = []

  for (const [file, data] of Object.entries(files)) {
    const result = checkTheme(file, data)
    if (result.ok) themes.push(result.theme)
    else problems.push(...result.problems.map((problem) => `${file}, ${problem.path || 'whole file'}: ${problem.message}`))
  }

  if (problems.length > 0) throw new Error(`Themes have problems:\n${problems.map((problem) => `  ${problem}`).join('\n')}`)
  if (themes.length === 0) throw new Error('No themes found: the app needs at least one')
  return themes.sort((a, b) => a.id.localeCompare(b.id))
}
