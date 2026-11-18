// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { findTheme, pickTheme } from './themes'

function renderLibrary() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  )
}

const radio = (name: string) => screen.getByRole<HTMLInputElement>('radio', { name: new RegExp(`^${name}`) })

describe('theme picker', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('style')
  })

  it('opens from the library header and lists every theme, with the one in use picked', async () => {
    const user = userEvent.setup()
    pickTheme(findTheme('sunset')!)
    renderLibrary()

    await user.click(screen.getByRole('button', { name: 'Theme' }))
    const dialog = within(screen.getByRole('dialog', { name: 'Theme' }))
    expect(dialog.getAllByRole('radio').map((input) => input.closest('label')?.textContent)).toEqual([
      'AaChalkboardColored chalk on a dusty green board, in a wooden frame.',
      'AaSpace TravelGlass panels over a drifting starfield, lit in cyan.',
      'AaSticky NotesYellow notes taped to lined paper, written in marker.',
      'AaSunriseWarm cream and orange, bright and friendly.',
      'AaSunsetSunrise after dark: warm browns with a glowing orange.',
    ])
    expect(radio('Sunset').checked).toBe(true)
  })

  it('applies a theme as soon as it’s tapped, and remembers it', async () => {
    const user = userEvent.setup()
    pickTheme(findTheme('sunrise')!)
    const { unmount } = renderLibrary()

    await user.click(screen.getByRole('button', { name: 'Theme' }))
    await user.click(radio('Sunset'))
    expect(document.documentElement.dataset.theme).toBe('sunset')
    expect(document.documentElement.style.getPropertyValue('color-scheme')).toBe('dark')
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    unmount()

    renderLibrary()
    await user.click(screen.getByRole('button', { name: 'Theme' }))
    expect(radio('Sunset').checked).toBe(true)
  })
})
