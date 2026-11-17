import type { PackProblem } from '../content/loadPacks'
import { parseColor, type ParsedColor } from './color'
import type { ColorToken, Theme } from './schema'

/** From the gamma-encoded sRGB a hex color is written in, to linear light. */
const linear = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)

/** A color's red, green and blue in linear light, 0–1. Colors outside what a screen can show are clipped to it. */
function linearRgb(color: ParsedColor): [number, number, number] {
  if (color.space === 'srgb') return [linear(color.r), linear(color.g), linear(color.b)]

  // OKLCH → OKLab → LMS → linear sRGB (Björn Ottosson's published matrices, the ones browsers use).
  const a = color.c * Math.cos((color.h * Math.PI) / 180)
  const b = color.c * Math.sin((color.h * Math.PI) / 180)
  const l = (color.l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (color.l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (color.l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const clip = (value: number) => Math.min(1, Math.max(0, value))
  return [
    clip(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clip(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clip(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

/** How bright a color looks, 0 (black) to 1 (white): WCAG's "relative luminance". */
export function luminance(text: string): number {
  const color = parseColor(text)
  if (!color) throw new Error(`Not a theme color: ${text}`)
  const [r, g, b] = linearRgb(color)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG's contrast ratio between two colors: 1 (the same) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

/** A pair of colors one is drawn on the other, and the least contrast it needs (WCAG 2.2, level AA). */
interface Pair {
  text: ColorToken
  on: ColorToken
  minimum: number
  what: string
}

const text = 4.5 // ordinary text
const large = 3 // large text (24px, or 19px bold), and the edges of buttons, fields and the focus outline

/** Every pair the app draws, from the components' classes. Add a pair here when a component starts using one. */
export const contrastPairs: Pair[] = [
  { text: 'foreground', on: 'background', minimum: text, what: 'text' },
  { text: 'card-foreground', on: 'card', minimum: text, what: 'text' },
  { text: 'primary-foreground', on: 'primary', minimum: text, what: 'text' },
  { text: 'secondary-foreground', on: 'secondary', minimum: text, what: 'text' },
  { text: 'success-foreground', on: 'success', minimum: text, what: 'text' },
  { text: 'warning-foreground', on: 'warning', minimum: text, what: 'text' },
  { text: 'destructive-foreground', on: 'destructive', minimum: text, what: 'text' },
  { text: 'muted-foreground', on: 'background', minimum: text, what: 'text' },
  { text: 'muted-foreground', on: 'card', minimum: text, what: 'text' },
  { text: 'muted-foreground', on: 'muted', minimum: text, what: 'text' },
  { text: 'primary', on: 'background', minimum: text, what: 'links and highlighted text' },
  { text: 'destructive', on: 'background', minimum: text, what: 'error messages' },
  { text: 'warning', on: 'background', minimum: large, what: 'the timer’s large numbers when time is short' },
  { text: 'ring', on: 'background', minimum: large, what: 'the keyboard focus outline' },
  { text: 'border', on: 'background', minimum: large, what: 'the outline of a button' },
  { text: 'border', on: 'card', minimum: large, what: 'the outline of a button in a dialog' },
  { text: 'input', on: 'background', minimum: large, what: 'the outline of a text field' },
]

/**
 * Checks that every pair of colors the app draws can be read (ADR 0010). One problem per pair under its minimum,
 * at the color to change, saying what it's used for, its ratio and the minimum.
 */
export function checkContrast(theme: Pick<Theme, 'colors'>): PackProblem[] {
  return contrastPairs.flatMap(({ text: front, on, minimum, what }) => {
    const ratio = contrastRatio(theme.colors[front], theme.colors[on])
    // Rounded down, so a ratio shown as 4.5 always passes a 4.5 minimum.
    const shown = Math.floor(ratio * 100) / 100
    return ratio >= minimum
      ? []
      : [{ path: `colors.${front}`, message: `${front} on ${on} (${what}) has a contrast of ${shown} : 1; it needs at least ${minimum} : 1` }]
  })
}
