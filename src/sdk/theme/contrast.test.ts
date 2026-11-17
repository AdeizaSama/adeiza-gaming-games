import { describe, expect, it } from 'vitest'
import { checkContrast, contrastRatio } from './contrast'
import type { ColorToken } from './schema'
import { themeData } from './testTheme'

const theme = (colors: Partial<Record<ColorToken, string>>) => ({ colors: { ...themeData().colors, ...colors } })

describe('contrastRatio', () => {
  it('matches WCAG’s published values, in either order and in either color format', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
    expect(contrastRatio('#ffffff', '#777777')).toBe(contrastRatio('#777777', '#ffffff'))
    expect(contrastRatio('oklch(1 0 0)', '#000000')).toBeCloseTo(21, 2)
    // Pure red, #ff0000, written in oklch: the same 5.25 : 1 against black.
    expect(contrastRatio('oklch(0.62796 0.25768 29.234)', '#000000')).toBeCloseTo(contrastRatio('#ff0000', '#000000'), 2)
    expect(contrastRatio('#ff0000', '#000000')).toBeCloseTo(5.25, 2)
    expect(contrastRatio('#ff8000', '#ff8000')).toBe(1)
  })
})

describe('checkContrast', () => {
  it('passes black and white everywhere', () => {
    expect(checkContrast(theme({}))).toEqual([])
  })

  it('reports each pair under its minimum at the color to change, with what it’s for, its ratio and the minimum', () => {
    const problems = checkContrast(theme({ primary: '#999999', 'primary-foreground': '#ffffff' }))
    expect(problems).toEqual([
      { path: 'colors.primary-foreground', message: 'primary-foreground on primary (text) has a contrast of 2.84 : 1; it needs at least 4.5 : 1' },
      { path: 'colors.primary', message: 'primary on background (links and highlighted text) has a contrast of 2.84 : 1; it needs at least 4.5 : 1' },
    ])
  })

  it('checks the outlines of buttons against the page and dialogs, and of text fields against the page', () => {
    expect(checkContrast(theme({ border: '#dddddd', input: '#dddddd' })).map((problem) => problem.message)).toEqual([
      'border on background (the outline of a button) has a contrast of 1.35 : 1; it needs at least 3 : 1',
      'border on card (the outline of a button in a dialog) has a contrast of 1.35 : 1; it needs at least 3 : 1',
      'input on background (the outline of a text field) has a contrast of 1.35 : 1; it needs at least 3 : 1',
    ])
  })

  it('checks the text on glass cards against the page behind them, and only for glass', () => {
    // White text on black cards, on a white page: fine on solid cards, unreadable where the page shows through.
    const colors = theme({ card: '#000000', 'card-foreground': '#ffffff' }).colors
    const plain = checkContrast({ colors, parts: { surface: 'plain' } }).map((problem) => problem.message)
    const glass = checkContrast({ colors, parts: { surface: 'glass' } }).map((problem) => problem.message)
    expect(glass.filter((message) => !plain.includes(message))).toEqual([
      'card-foreground on background (text on see-through glass cards) has a contrast of 1 : 1; it needs at least 4.5 : 1',
    ])
  })

  it('lets large text and the focus ring pass at 3 : 1, but not below', () => {
    expect(checkContrast(theme({ warning: '#949494', 'warning-foreground': '#000000', ring: '#949494' }))).toEqual([])
    expect(checkContrast(theme({ warning: '#aaaaaa', 'warning-foreground': '#000000' })).map((problem) => problem.path)).toEqual(['colors.warning'])
  })
})
