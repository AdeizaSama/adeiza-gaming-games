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
})
