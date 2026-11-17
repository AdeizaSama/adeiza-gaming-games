import { describe, expect, it } from 'vitest'
import { fonts, type Font } from '../../sdk/theme/fonts'
import imports from './fonts.ts?raw'

// Each bundled font's own CSS and metadata, read as files from node_modules.
const css = import.meta.glob<string>('/node_modules/@fontsource-variable/*/index.css', { query: '?raw', import: 'default', eager: true })
const metadata = import.meta.glob<{ license: { type: string } }>('/node_modules/@fontsource-variable/*/metadata.json', {
  import: 'default',
  eager: true,
})

const bundled = Object.entries(fonts as Record<string, Font>).filter(([, font]) => font.bundled)

describe('bundled fonts', () => {
  it('are each imported, so their files are served', () => {
    expect(bundled.length).toBeGreaterThan(0)
    for (const [id, font] of bundled) expect(imports, id).toContain(`import '${font.bundled!.package}'`)
  })

  it('use the family name their CSS declares, and are under the license the font states', () => {
    for (const [id, font] of bundled) {
      const name = font.bundled!.package
      const declared = /font-family: '([^']+)'/.exec(css[`/node_modules/${name}/index.css`])?.[1]
      expect(font.family.startsWith(`"${declared}", `), `${id}: ${font.family} vs ${declared}`).toBe(true)
      expect(metadata[`/node_modules/${name}/metadata.json`].license.type, id).toBe(font.bundled!.license)
    }
  })
})
