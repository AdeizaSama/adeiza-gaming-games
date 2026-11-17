import { fonts } from './fonts'
import { colorTokens, type Theme } from './schema'

/** Shadows for small raised things (cards, list rows) and big ones (dialogs), by the theme's `shadow`. */
const elevations: Record<Theme['shadow'], { sm: string; lg: string }> = {
  flat: { sm: 'none', lg: 'none' },
  // Tailwind's own shadow-sm and shadow-lg: what the app has always used.
  soft: {
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  // Hard-edged and offset, in the text color, like a cut-out stuck on the page.
  bold: { sm: '3px 3px 0 0 var(--foreground)', lg: '6px 6px 0 0 var(--foreground)' },
}

/** Icon line weights, by the theme's `parts.icons`. Lucide draws at 2. */
const iconStrokes: Record<Theme['parts']['icons'], string> = { thin: '1.5', regular: '2', bold: '2.75' }

/** Outline widths (`border-line`), by the theme's `border`. */
const lines: Record<Theme['border'], string> = { thin: '2px', thick: '3px' }

/**
 * The CSS variables a theme sets (ADR 0010): every color token under its own name, plus the radius, the fonts, the
 * shadows, the outline width, the page background and the animation speed. `index.css` maps them to Tailwind
 * classes, so `bg-primary` reads `--primary`.
 */
export function themeVariables(theme: Theme): Record<string, string> {
  const { gradient } = theme
  return {
    ...Object.fromEntries(colorTokens.map((token) => [`--${token}`, theme.colors[token]])),
    '--radius': `${theme.radius}rem`,
    '--font-body': fonts[theme.fonts.body].family,
    '--font-heading': fonts[theme.fonts.heading].family,
    '--elevation-sm': elevations[theme.shadow].sm,
    '--elevation-lg': elevations[theme.shadow].lg,
    '--line': lines[theme.border],
    '--page-gradient': gradient ? `linear-gradient(to bottom, var(--${gradient.from}), var(--${gradient.to}))` : 'none',
    '--icon-stroke': iconStrokes[theme.parts.icons],
    '--duration': `${theme.duration}ms`,
  }
}

/**
 * The attributes a theme puts on `<html>`: its id, and the part it picked for each kind (ADR 0011), which
 * `parts.css` styles by, e.g. `[data-surface='paper'] .bg-card`.
 */
export function themeAttributes(theme: Theme): Record<string, string> {
  const { surface, button, background, decoration } = theme.parts
  return { 'data-theme': theme.id, 'data-surface': surface, 'data-button': button, 'data-background': background, 'data-decoration': decoration }
}

/** What `applyTheme` wrote: enough to put the same look back before the first paint. */
export interface AppliedLook {
  style: string
  attributes: Record<string, string>
}

/**
 * Applies a theme to the page: its variables and `color-scheme` (so scrollbars and form controls match) as the
 * `<html>` element's inline style, which replaces any theme applied before, and its attributes. Also sets the
 * browser's `theme-color`, which colors the address bar on phones. Returns what it wrote, so it can be saved and
 * put back before the first paint next time.
 */
export function applyTheme(theme: Theme, document: Document = globalThis.document): AppliedLook {
  const style = [...Object.entries(themeVariables(theme)), ['color-scheme', theme.scheme]].map(([name, value]) => `${name}: ${value}`).join('; ')
  const attributes = themeAttributes(theme)
  const root = document.documentElement
  root.setAttribute('style', style)
  for (const [name, value] of Object.entries(attributes)) root.setAttribute(name, value)

  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.append(meta)
  }
  meta.content = theme.colors.background
  return { style, attributes }
}
