import { fonts } from './fonts'
import { colorTokens, type Theme } from './schema'

/**
 * The CSS variables a theme sets (ADR 0010): every color token under its own name, plus the radius, the fonts and the
 * animation speed. `index.css` maps them to Tailwind classes, so `bg-primary` reads `--primary`.
 */
export function themeVariables(theme: Theme): Record<string, string> {
  return {
    ...Object.fromEntries(colorTokens.map((token) => [`--${token}`, theme.colors[token]])),
    '--radius': `${theme.radius}rem`,
    '--font-body': fonts[theme.fonts.body].family,
    '--font-heading': fonts[theme.fonts.heading].family,
    '--duration': `${theme.duration}ms`,
  }
}

/**
 * Applies a theme to the page: its variables and `color-scheme` (so scrollbars and form controls match) as the
 * `<html>` element's inline style, which replaces any theme applied before. Also sets `data-theme`, and the
 * browser's `theme-color`, which colors the address bar on phones. Returns the style text, so it can be saved and
 * put back before the first paint next time.
 */
export function applyTheme(theme: Theme, document: Document = globalThis.document): string {
  const style = [...Object.entries(themeVariables(theme)), ['color-scheme', theme.scheme]].map(([name, value]) => `${name}: ${value}`).join('; ')
  const root = document.documentElement
  root.setAttribute('style', style)
  root.dataset.theme = theme.id

  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.append(meta)
  }
  meta.content = theme.colors.background
  return style
}
