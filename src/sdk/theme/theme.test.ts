import { describe, expect, it } from 'vitest'
import { parseColor } from './color'
import { checkTheme, loadThemes } from './loadThemes'
import { themeData } from './testTheme'

const file = 'src/themes/paper.json'
const problems = (data: unknown) => {
  const result = checkTheme(file, data)
  return result.ok ? [] : result.problems.map((problem) => `${problem.path}: ${problem.message}`)
}

describe('parseColor', () => {
  it('reads #rrggbb and oklch(L C H), with lightness as a number or a percentage', () => {
    expect(parseColor('#ff8000')).toEqual({ space: 'srgb', r: 1, g: 128 / 255, b: 0 })
    expect(parseColor('oklch(0.64 0.19 42)')).toEqual({ space: 'oklch', l: 0.64, c: 0.19, h: 42 })
    expect(parseColor('oklch(64% .19 42)')).toEqual({ space: 'oklch', l: 0.64, c: 0.19, h: 42 })
  })

  it('rejects other formats and values out of range', () => {
    for (const text of ['#f80', 'orange', 'rgb(255 128 0)', 'oklch(1.2 0.1 40)', 'oklch(0.5 0.6 40)', 'oklch(0.5 0.1 400)', 'oklch(0.5, 0.1, 40)']) {
      expect(parseColor(text), text).toBeUndefined()
    }
  })
})

describe('checkTheme', () => {
  it('fills in every optional field with its default', () => {
    const result = checkTheme(file, themeData())
    expect(result.ok && result.theme).toMatchObject({
      fonts: { body: 'system-rounded', heading: 'system-rounded' },
      radius: 1,
      shadow: 'soft',
      border: 'thin',
      duration: 200,
      parts: { surface: 'plain', button: 'solid', background: 'flat', decoration: 'none', icons: 'regular' },
    })
    expect(result.ok && result.theme.gradient).toBeUndefined()
  })

  it('reports a missing or unreadable color, an unknown field, a font not on the list and a scheme that isn’t light or dark', () => {
    const colors: Record<string, string> = { ...themeData().colors }
    delete colors.ring
    const found = problems(themeData({ colors: { ...colors, primary: 'orange' }, fonts: { body: 'comic-sans' }, scheme: 'both', colour: 'red' }))
    expect(found).toEqual(
      expect.arrayContaining([
        'colors.primary: Use a color like "#ff8800" or "oklch(0.64 0.19 42)"',
        expect.stringMatching(/^colors\.ring: /),
        expect.stringMatching(/^fonts\.body: /),
        expect.stringMatching(/^scheme: /),
        expect.stringMatching(/colour/),
      ]),
    )
  })

  it('reports an id that isn’t the file name, and a gradient from a color that isn’t a token', () => {
    expect(problems(themeData({ id: 'card' }))).toEqual(['id: The id must match the file name: "paper" (found "card")'])
    expect(problems(themeData({ gradient: { from: 'background', to: 'sky' } }))).toEqual([expect.stringMatching(/^gradient\.to: /)])
  })
})

describe('loadThemes', () => {
  it('returns the themes sorted by id', () => {
    const themes = loadThemes({ 'src/themes/paper.json': themeData(), 'src/themes/ink.json': themeData({ id: 'ink', scheme: 'dark' }) })
    expect(themes.map((theme) => theme.id)).toEqual(['ink', 'paper'])
  })

  it('throws one error listing every problem in every file, and throws when there are no themes', () => {
    expect(() => loadThemes({ 'src/themes/paper.json': themeData({ radius: 5 }), 'src/themes/ink.json': themeData() })).toThrow(
      /src\/themes\/paper\.json, radius: [\s\S]*src\/themes\/ink\.json, id: /,
    )
    expect(() => loadThemes({})).toThrow('No themes found')
  })
})
