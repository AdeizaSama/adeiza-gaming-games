import { colorTokens, type ColorToken } from './schema'

/** Colors drawn on the page or used as text on it: black on the fixture's white page. */
const accents = new Set<string>(['primary', 'success', 'warning', 'destructive', 'ring', 'border', 'input'])

/**
 * For tests: a valid theme file's contents, with some fields changed. Black and white only, so every pair passes
 * the contrast check: white surfaces with black text, black accents with white text on them.
 */
export function themeData(changes: Record<string, unknown> = {}) {
  const colors = Object.fromEntries(
    colorTokens.map((token) => {
      const isText = token === 'foreground' || token.endsWith('-foreground')
      const dark = accents.has(token.replace(/-foreground$/, '')) !== isText
      return [token, dark ? '#000000' : '#ffffff']
    }),
  ) as Record<ColorToken, string>
  return { id: 'paper', name: 'Paper', description: 'Black and white.', contributors: ['AdeizaSama'], scheme: 'light', colors, ...changes }
}
