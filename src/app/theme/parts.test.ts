import { describe, expect, it } from 'vitest'
import { themeParts } from '../../sdk/theme/schema'
import { paintOnlyProblems, readRules } from './paintOnly'
import css from './parts.css?raw'

describe('paintOnlyProblems', () => {
  it('passes paint: colors, gradients, edges, shadows, tilt, and decorations that take no space', () => {
    const paint = `
      [data-surface='paper'] .bg-card:not(input) { background-image: linear-gradient(red, blue); border-color: red; box-shadow: none; transform: rotate(-1deg); position: relative }
      [data-decoration='tape'] [data-feature]::before { content: ''; position: absolute; top: -8px; left: 40%; width: 60px; height: 18px; pointer-events: none }
      @media (prefers-reduced-motion: no-preference) { body::before { position: fixed; inset: 0; pointer-events: none; animation: drift 60s linear infinite } }
      @keyframes drift { from { background-position: 0 0 } to { background-position: 0 100px; opacity: 0.8 } }`
    expect(paintOnlyProblems(paint)).toEqual([])
  })

  it('reports layout changes, decorations that could take space or taps, and motion that ignores reduced motion', () => {
    const bad = `
      .bg-card { padding: 4px; font-size: 20px; border-width: 4px; position: absolute }
      [data-feature]::after { content: ''; width: 10px }
      body::before { position: fixed; pointer-events: none; animation: spin 1s infinite }
      @keyframes spin { to { width: 10px; transform: rotate(1turn) } }`
    expect(paintOnlyProblems(bad)).toEqual([
      '.bg-card: padding changes layout; parts may only paint',
      '.bg-card: font-size changes layout; parts may only paint',
      '.bg-card: border-width changes layout; parts may only paint',
      '.bg-card: position changes layout; parts may only paint',
      '[data-feature]::after: a decoration must be position: absolute or fixed',
      '[data-feature]::after: a decoration must have pointer-events: none',
      'body::before: animation must be inside @media (prefers-reduced-motion: no-preference)',
      '@keyframes spin to: keyframes may only animate transform, opacity or background-position, not width',
    ])
  })
})

describe('parts.css', () => {
  it('only paints', () => {
    expect(paintOnlyProblems(css)).toEqual([])
  })

  it('has CSS for every option a theme can pick, except each part’s plain default', () => {
    const selectors = readRules(css).map((rule) => rule.selector).join('\n')
    const kinds = { surface: 'data-surface', button: 'data-button', background: 'data-background', decoration: 'data-decoration' } as const
    for (const [kind, attribute] of Object.entries(kinds)) {
      const [, ...options] = themeParts[kind as keyof typeof kinds]
      for (const option of options) expect(selectors, `${kind}: ${option}`).toContain(`[${attribute}='${option}']`)
    }
  })
})
