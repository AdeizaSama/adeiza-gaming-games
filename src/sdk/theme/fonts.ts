/**
 * The fonts a theme can pick, by id (ADR 0010). A system font costs nothing: the phone already has it. A bundled
 * font is installed from npm and served from our own site; its files download only when text on the page uses it.
 *
 * Adding a font: install its `@fontsource-variable/…` package, import it in `src/app/theme/fonts.ts`, add it here
 * with its license, and check the license is the SIL Open Font License (`OFL-1.1`). The test in `fonts.test.ts`
 * checks that every bundled font here is imported there.
 */
export interface Font {
  /** The name shown to designers in the JSON Schema. */
  name: string
  /** The CSS `font-family` value, with system fonts to fall back on while it loads. */
  family: string
  /** For a bundled font: the npm package it comes from and its license. System fonts have none. */
  bundled?: { package: string; license: 'OFL-1.1' }
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
  nunito: {
    name: 'Nunito: rounded and friendly, easy to read',
    family: `"Nunito Variable", ${rounded}`,
    bundled: { package: '@fontsource-variable/nunito', license: 'OFL-1.1' },
  },
} satisfies Record<string, Font>

export type FontId = keyof typeof fonts
export const fontIds = Object.keys(fonts) as FontId[]
