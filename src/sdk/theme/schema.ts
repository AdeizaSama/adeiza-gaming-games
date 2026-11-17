import { z } from 'zod'
import { PackInfo } from '../content/pack'
import { parseColor } from './color'
import { fontIds } from './fonts'

/** Every color a theme sets (standard §11). Components use only these, through Tailwind classes like `bg-primary`. */
export const colorTokens = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'success',
  'success-foreground',
  'warning',
  'warning-foreground',
  'destructive',
  'destructive-foreground',
  'border',
  'input',
  'ring',
] as const

export type ColorToken = (typeof colorTokens)[number]

const ColorTokenName = z.enum(colorTokens)

/**
 * The looks a theme can pick for each part (ADR 0011), built in `src/app/theme/parts.css`. The first of each is the
 * default: the app's plain look. Adding an option here means adding its CSS there.
 */
export const themeParts = {
  surface: ['plain', 'paper', 'sticky-note', 'glass', 'chalkboard'],
  button: ['solid', 'chunky', 'sticker', 'glass', 'chalk'],
  background: ['flat', 'lined-paper', 'dot-grid', 'chalk-dust', 'starfield'],
  decoration: ['none'],
  icons: ['thin', 'regular', 'bold'],
} as const

const Color = z
  .string()
  .refine((text) => parseColor(text) !== undefined, 'Use a color like "#ff8800" or "oklch(0.64 0.19 42)"')
  .meta({ description: 'A color: "#rrggbb", or "oklch(lightness chroma hue)" with lightness 0–1, chroma 0–0.5, hue 0–360.' })

const FontId = z.enum(fontIds).meta({ description: 'A font from the list in src/sdk/theme/fonts.ts.' })

/**
 * A theme file, `src/themes/<id>.json` (ADR 0010). Strict, like packs: an unknown field is usually a typo.
 * Only `id`, `name`, `description`, `contributors`, `scheme` and `colors` are required; the rest have defaults.
 */
export const themeSchema = z.strictObject({
  $schema: PackInfo.shape.$schema,
  id: PackInfo.shape.id.meta({ description: 'Must match the file name: "sticky-notes" for sticky-notes.json.' }),
  name: PackInfo.shape.name.meta({ description: 'The theme name players see, e.g. "Sticky Notes".' }),
  description: PackInfo.shape.description.meta({ description: 'One sentence describing the look.' }),
  contributors: PackInfo.shape.contributors.meta({ description: 'GitHub usernames of the people who made the theme. Add yours.' }),
  scheme: z.enum(['light', 'dark']).meta({ description: 'Whether the theme is light or dark. A theme is always one or the other.' }),
  colors: z
    .strictObject(Object.fromEntries(colorTokens.map((token) => [token, Color])) as Record<ColorToken, typeof Color>)
    .meta({ description: 'Every color token. Each "-foreground" color is for text on the color it is named after.' }),
  fonts: z
    .strictObject({
      body: FontId.default('system-rounded'),
      heading: FontId.default('system-rounded'),
    })
    .prefault({})
    .meta({ description: 'The font for text, and the font for headings and the big words on cards.' }),
  radius: z.number().min(0).max(2).default(1).meta({ description: 'Corner rounding in rem: 0 is square, 2 is very round.' }),
  shadow: z.enum(['flat', 'soft', 'bold']).default('soft').meta({ description: 'Shadows under cards and buttons: none, soft, or bold and sharp.' }),
  border: z.enum(['thin', 'thick']).default('thin').meta({ description: 'How heavy outlines are.' }),
  gradient: z
    .strictObject({ from: ColorTokenName, to: ColorTokenName })
    .optional()
    .meta({ description: 'Fades the page background from one color token to another, top to bottom. Leave out for a plain background.' }),
  duration: z.int().min(0).max(400).default(200).meta({ description: 'How long animations take, in milliseconds.' }),
  parts: z
    .strictObject({
      surface: z
        .enum(themeParts.surface)
        .default('plain')
        .meta({ description: 'How cards and dialogs look.' }),
      button: z.enum(themeParts.button).default('solid').meta({ description: 'How buttons look.' }),
      background: z.enum(themeParts.background).default('flat').meta({ description: 'The page behind everything.' }),
      decoration: z.enum(themeParts.decoration).default('none').meta({ description: 'Small drawings on the flash card and dialogs.' }),
      icons: z.enum(themeParts.icons).default('regular').meta({ description: 'How heavy icon lines are.' }),
    })
    .prefault({})
    .meta({ description: 'Looks to pick from a menu (ADR 0011). Leave out any you don\'t want; each defaults to the plain look.' }),
})

export type Theme = z.output<typeof themeSchema>
