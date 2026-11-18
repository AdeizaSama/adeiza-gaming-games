// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import html from '../../../index.html?raw'
import { applyTheme } from '../../sdk/theme/apply'
import { findTheme, lookKey, pickTheme, startingTheme } from './themes'

const sunrise = findTheme('sunrise')!
const sunset = findTheme('sunset')!
const root = () => document.documentElement
const phone = (dark: boolean) => () => dark

describe('applying a theme', () => {
  beforeEach(() => {
    localStorage.clear()
    for (const name of root().getAttributeNames()) root().removeAttribute(name)
  })

  it('writes the theme’s variables, color scheme, name and address-bar color on the page', () => {
    applyTheme(sunset)
    expect(root().style.getPropertyValue('--primary')).toBe(sunset.colors.primary)
    expect(root().style.getPropertyValue('--radius')).toBe('1rem')
    expect(root().style.getPropertyValue('--duration')).toBe('200ms')
    expect(root().style.getPropertyValue('color-scheme')).toBe('dark')
    expect(root().dataset.theme).toBe('sunset')
    expect(document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content).toBe(sunset.colors.background)

    applyTheme(sunrise)
    expect(root().style.getPropertyValue('--primary')).toBe(sunrise.colors.primary)
    expect(root().style.getPropertyValue('color-scheme')).toBe('light')
    expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1)
  })

  it('starts a first visit on Sunrise or Sunset by the phone’s setting, and after that on the theme picked', () => {
    expect(startingTheme(localStorage, phone(true)).id).toBe('sunset')
    expect(startingTheme(localStorage, phone(false)).id).toBe('sunrise')

    pickTheme(sunrise)
    expect(startingTheme(localStorage, phone(true)).id).toBe('sunrise')

    localStorage.setItem('ku-zo-wasa:theme', 'removed-theme')
    expect(startingTheme(localStorage, phone(true)).id).toBe('sunset')
  })

  it('opens on the phone’s setting when storage is switched off', () => {
    const off = { getItem: () => { throw new Error('off') } } as unknown as Storage
    expect(startingTheme(off, phone(true)).id).toBe('sunset')
  })

  it('remembers the look, and index.html puts it back before the app starts', () => {
    localStorage.setItem('ku-zo-wasa:theme-style', 'left over from chapter 08')
    pickTheme(sunset)
    expect(JSON.parse(localStorage.getItem(lookKey)!)).toEqual({
      style: root().getAttribute('style'),
      attributes: { 'data-theme': 'sunset', 'data-surface': 'plain', 'data-button': 'solid', 'data-background': 'flat', 'data-decoration': 'none' },
    })
    expect(localStorage.getItem('ku-zo-wasa:theme-style')).toBeNull()

    for (const name of root().getAttributeNames()) root().removeAttribute(name) // a fresh page load, before the app's script
    const script = /<script>([\s\S]*?)<\/script>/.exec(html)![1]
    new Function(script)()
    expect(root().style.getPropertyValue('--primary')).toBe(sunset.colors.primary)
    expect(root().dataset.theme).toBe('sunset')
    expect(root().dataset.surface).toBe('plain')
  })
})
