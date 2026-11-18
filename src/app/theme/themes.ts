import { applyTheme } from '../../sdk/theme/apply'
import { loadThemes } from '../../sdk/theme/loadThemes'
import type { Theme } from '../../sdk/theme/schema'

/** Every theme in `src/themes/`, checked and sorted by id (ADR 0010). Adding a theme is adding a file there. */
export const themes = loadThemes(import.meta.glob('../../themes/*.json', { eager: true, import: 'default' }))

/** The themes a first visit starts on, by the phone's dark-mode setting. */
export const firstThemes = { light: 'sunrise', dark: 'sunset' } as const

const key = 'ku-zo-wasa:theme'
/** The applied theme's look (style text and attributes, as JSON), which `index.html` puts back before the first paint. */
export const lookKey = 'ku-zo-wasa:theme-look'

/** The theme with this id, or `undefined` if there's none (a theme can be removed while a phone remembers it). */
export function findTheme(id: string | null | undefined): Theme | undefined {
  return themes.find((theme) => theme.id === id)
}

/**
 * The theme to open with: the one picked on this device, or, the first time, Sunrise or Sunset by the phone's
 * dark-mode setting. After that the phone's setting is never read again: a theme only changes when a player picks one.
 */
export function startingTheme(storage: Storage = localStorage, prefersDark = () => matchMedia('(prefers-color-scheme: dark)').matches): Theme {
  let saved: string | null = null
  try {
    saved = storage.getItem(key)
  } catch {
    // Storage switched off: start as if it's the first visit.
  }
  return findTheme(saved) ?? findTheme(prefersDark() ? firstThemes.dark : firstThemes.light) ?? themes[0]
}

/** Applies a theme and remembers it on this device, with its look for the next first paint. */
export function pickTheme(theme: Theme, storage: Storage = localStorage, document: Document = globalThis.document): void {
  const look = applyTheme(theme, document)
  try {
    storage.setItem(key, theme.id)
    storage.setItem(lookKey, JSON.stringify(look))
    storage.removeItem('ku-zo-wasa:theme-style') // the style alone, as chapter 08 saved it
  } catch {
    // Storage full or switched off: the theme still applies until the page closes.
  }
}
