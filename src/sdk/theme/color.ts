/** A color as a theme writes it, read into numbers. */
export type ParsedColor = { space: 'srgb'; r: number; g: number; b: number } | { space: 'oklch'; l: number; c: number; h: number }

const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
const oklch = /^oklch\(\s*(\d*\.?\d+)(%?)\s+(\d*\.?\d+)\s+(\d*\.?\d+)\s*\)$/

/**
 * Reads a theme color: `#rrggbb`, or `oklch(L C H)` with lightness 0–1 (or 0–100%), chroma 0–0.5 and hue 0–360.
 * Returns undefined for anything else, including values out of range.
 */
export function parseColor(text: string): ParsedColor | undefined {
  const h = hex.exec(text)
  if (h) return { space: 'srgb', r: parseInt(h[1], 16) / 255, g: parseInt(h[2], 16) / 255, b: parseInt(h[3], 16) / 255 }

  const o = oklch.exec(text)
  if (!o) return undefined
  const l = Number(o[1]) / (o[2] ? 100 : 1)
  const c = Number(o[3])
  const hue = Number(o[4])
  if (l > 1 || c > 0.5 || hue > 360) return undefined
  return { space: 'oklch', l, c, h: hue }
}
