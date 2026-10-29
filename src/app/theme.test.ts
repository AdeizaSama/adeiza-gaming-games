import { describe, expect, it } from 'vitest'
import css from './index.css?raw'

// Reads the theme in index.css as text (`?raw` asks Vite for a file's contents instead of applying it): the tokens
// are CSS, and these tests check how they fit together.

/** The variables declared inside the first block that starts with `opening`, e.g. `:root {`. */
function variablesIn(opening: string, from = 0): string[] {
  const start = css.indexOf(opening, from)
  const end = css.indexOf('}', start)
  return [...css.slice(start, end).matchAll(/(--[\w-]+):/g)].map((match) => match[1])
}

const light = variablesIn(':root {')
const dark = variablesIn(':root {', css.indexOf('prefers-color-scheme: dark'))
const colors = dark // dark mode changes colors only, so its list is exactly the color tokens

describe('theme tokens', () => {
  it('gives every color a value in both light and dark mode', () => {
    expect(colors.length).toBeGreaterThan(0)
    expect(light).toEqual(expect.arrayContaining(colors))
    expect(light.filter((name) => !colors.includes(name))).toEqual(['--radius', '--font-body', '--duration'])
  })

  it('makes every color token available to Tailwind classes', () => {
    for (const name of colors) {
      expect(css, name).toContain(`--color-${name.slice(2)}: var(${name});`)
    }
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
