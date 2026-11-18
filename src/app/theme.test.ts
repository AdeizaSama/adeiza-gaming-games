import { describe, expect, it } from 'vitest'
import { checkContrast } from '../sdk/theme/contrast'
import { colorTokens } from '../sdk/theme/schema'
import css from './index.css?raw'
import { findTheme, firstThemes, themes } from './theme/themes'

// Reads index.css as text (`?raw` asks Vite for a file's contents instead of applying it): it maps the theme
// tokens to Tailwind, and these tests check that the mapping and the theme files fit together.

describe('theme tokens', () => {
  it('declares no values of its own, and makes every color token available to Tailwind classes', () => {
    // Values come from theme files (ADR 0010). A value here would be a second source that themes can't change.
    expect(css).not.toMatch(/oklch\(|#[0-9a-f]{3,8}\b|prefers-color-scheme/i)
    for (const token of colorTokens) {
      expect(css, token).toContain(`--color-${token}: var(--${token});`)
    }
  })

  it('maps the theme’s fonts, shadows and outline width to classes, and puts headings in the heading font', () => {
    expect(css).toContain('--shadow-sm: var(--elevation-sm);')
    expect(css).toContain('--shadow-lg: var(--elevation-lg);')
    expect(css).toMatch(/@utility border-line \{\s*border-width: var\(--line\);/)
    expect(css).toMatch(/@utility font-heading \{\s*font-family: var\(--font-heading\);/)
    expect(css).toMatch(/h1,\s*h2,\s*h3,\s*h4,\s*h5 \{\s*@apply font-heading;/)
    expect(css).toContain('background-image: var(--page-gradient);')
  })

  it('ships themes that pass the contrast check, and first-visit themes that are light and dark', () => {
    for (const theme of themes) expect(checkContrast(theme), theme.id).toEqual([])
    expect(findTheme(firstThemes.light)?.scheme).toBe('light')
    expect(findTheme(firstThemes.dark)?.scheme).toBe('dark')
  })

  it('is the only source of colors: no file uses a built-in Tailwind color', () => {
    const palette =
      'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white'
    const rawColor = new RegExp(`\\b[a-z-]+-(${palette})(-\\d{2,3})?(/\\d+)?\\b`, 'g')

    // Every .ts and .tsx file in src/ except this one, as text, keyed by path.
    const files = import.meta.glob<string>(['/src/**/*.{ts,tsx}', '!/src/app/theme.test.ts'], {
      query: '?raw',
      import: 'default',
      eager: true,
    })
    const offenders = Object.entries(files).flatMap(([file, text]) =>
      [...text.matchAll(rawColor)].map((match) => `${file}: ${match[0]}`),
    )

    // Tailwind's palette is switched off in index.css, so a class like `bg-red-500` would silently do nothing.
    expect(offenders).toEqual([])
  })

  it('lets the page pattern show everywhere: no component paints a solid strip of page color', () => {
    const files = import.meta.glob<string>(['/src/**/*.tsx', '!/src/**/*.test.tsx'], { query: '?raw', import: 'default', eager: true })
    const offenders = Object.entries(files).flatMap(([file, text]) =>
      [...text.matchAll(/(?<![\w:-])bg-background(?![\w/-])/g)].map((match) => `${file}: ${match[0]}`),
    )
    // A solid bg-background hides a theme's lined paper, stars or chalk dust behind it. Use bg-background/75 with
    // backdrop-blur-md for a bar that must cover what scrolls under it.
    expect(offenders).toEqual([])
  })

  it('leaves outline widths to the theme: no file uses a fixed width like border-2', () => {
    // Components only: tests may name a fixed width on purpose, to check it's replaced.
    const files = import.meta.glob<string>(['/src/**/*.tsx', '!/src/**/*.test.tsx'], { query: '?raw', import: 'default', eager: true })
    const offenders = Object.entries(files).flatMap(([file, text]) =>
      [...text.matchAll(/\bborder-([xytblr]-)?\d\b/g)].map((match) => `${file}: ${match[0]}`),
    )
    // Use border-line, which is 2px or 3px as the theme says.
    expect(offenders).toEqual([])
  })
})
