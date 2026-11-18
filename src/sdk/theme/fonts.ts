/**
 * The fonts a theme can pick, by id (ADR 0010). A system font costs nothing: the phone already has it. A bundled
 * font is installed from npm and served from our own site; its files download only when text on the page uses it.
 *
 * Adding a font: install its Fontsource package (`@fontsource-variable/…` when there is one: every weight in one
 * file; otherwise `@fontsource/…`), import it in `src/app/theme/fonts.ts`, and add it here. Check the size of its
 * Latin file: a heading font over ~80 KB is a lot to download for titles. The test in `fonts.test.ts` checks that
 * every bundled font here is imported there, named as its CSS declares, and under the SIL Open Font License.
 */
export interface Font {
  /** The name shown to designers in the JSON Schema. */
  name: string
  /** The CSS `font-family` value, with system fonts to fall back on while it loads. */
  family: string
  /** For a bundled font: the npm package it comes from and its license. System fonts have none. */
  bundled?: { package: `@fontsource${'' | '-variable'}/${string}`; license: 'OFL-1.1' }
}

const rounded = 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif'

export const fonts = {
  'system-rounded': { name: 'The phone’s rounded font', family: rounded },
  'system-sans': { name: 'The phone’s standard font', family: 'system-ui, sans-serif' },
  'system-serif': { name: 'The phone’s serif font', family: 'ui-serif, Georgia, serif' },
  caveat: {
    name: 'Caveat: handwriting, like a marker on paper',
    family: `"Caveat Variable", ${rounded}`,
    bundled: { package: '@fontsource-variable/caveat', license: 'OFL-1.1' },
  },
  exo2: {
    name: 'Exo 2: clean and slightly technical',
    family: `"Exo 2 Variable", system-ui, sans-serif`,
    bundled: { package: '@fontsource-variable/exo-2', license: 'OFL-1.1' },
  },
  'gochi-hand': {
    name: 'Gochi Hand: handwriting, like chalk on a board',
    family: `"Gochi Hand", ${rounded}`,
    bundled: { package: '@fontsource/gochi-hand', license: 'OFL-1.1' },
  },
  nunito: {
    name: 'Nunito: rounded and friendly, easy to read',
    family: `"Nunito Variable", ${rounded}`,
    bundled: { package: '@fontsource-variable/nunito', license: 'OFL-1.1' },
  },
  orbitron: {
    name: 'Orbitron: wide and futuristic, for headings',
    family: `"Orbitron Variable", system-ui, sans-serif`,
    bundled: { package: '@fontsource-variable/orbitron', license: 'OFL-1.1' },
  },
} satisfies Record<string, Font>

export type FontId = keyof typeof fonts
export const fontIds = Object.keys(fonts) as FontId[]
