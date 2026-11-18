import { describe, expect, it } from 'vitest'
import { themeAttributes, themeVariables } from './apply'
import { checkTheme } from './loadThemes'
import { themeData } from './testTheme'

/** The variables for the test theme with some fields changed. */
function variables(changes: Record<string, unknown> = {}) {
  const result = checkTheme('src/themes/paper.json', themeData(changes))
  if (!result.ok) throw new Error(JSON.stringify(result.problems))
  return themeVariables(result.theme)
}

describe('themeVariables', () => {
  it('writes every color under its token’s name, and the fonts as their families with fallbacks', () => {
    const vars = variables({ fonts: { body: 'nunito', heading: 'caveat' } })
    expect(vars['--primary']).toBe('#000000')
    expect(vars['--card-foreground']).toBe('#000000')
    expect(vars['--font-body']).toMatch(/^"Nunito Variable", ui-rounded/)
    expect(vars['--font-heading']).toMatch(/^"Caveat Variable", ui-rounded/)
    expect(vars['--radius']).toBe('1rem')
  })

  it('turns shadow and border styles into CSS: none, soft or bold shadows, and 2px or 3px outlines', () => {
    expect(variables({ shadow: 'flat' })['--elevation-lg']).toBe('none')
    expect(variables()['--elevation-sm']).toContain('rgb(0 0 0 / 0.1)')
    expect(variables({ shadow: 'bold' })['--elevation-sm']).toBe('3px 3px 0 0 var(--foreground)')
    expect(variables()['--line']).toBe('2px')
    expect(variables({ border: 'thick' })['--line']).toBe('3px')
  })

  it('names the theme’s parts as attributes, and sets the icon line weight', () => {
    const result = checkTheme('src/themes/paper.json', themeData({ parts: { icons: 'thin' } }))
    expect(result.ok && themeAttributes(result.theme)).toEqual({
      'data-theme': 'paper',
      'data-surface': 'plain',
      'data-button': 'solid',
      'data-background': 'flat',
      'data-decoration': 'none',
    })
    expect(variables({ parts: { icons: 'thin' } })['--icon-stroke']).toBe('1.5')
    expect(variables()['--icon-stroke']).toBe('2')
    expect(variables({ parts: { icons: 'bold' } })['--icon-stroke']).toBe('2.75')
  })

  it('fades the page from one color token to another, or leaves it plain', () => {
    expect(variables()['--page-gradient']).toBe('none')
    expect(variables({ gradient: { from: 'background', to: 'muted' } })['--page-gradient']).toBe(
      'linear-gradient(to bottom, var(--background), var(--muted))',
    )
  })
})
