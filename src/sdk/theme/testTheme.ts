import { colorTokens } from './schema'

/** For tests: a valid theme file's contents, every color white or black, with some fields changed. */
export function themeData(changes: Record<string, unknown> = {}) {
  const colors = Object.fromEntries(colorTokens.map((token) => [token, token.endsWith('foreground') ? '#000000' : '#ffffff']))
  return { id: 'paper', name: 'Paper', description: 'Black on white.', contributors: ['AdeizaSama'], scheme: 'light', colors, ...changes }
}
