// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Variant } from '../../sdk/content/variant'
import { games } from '../registry'
import { loadVariantSetup, saveSetup, variantSetupId } from './savedSetup'
import { SetupScreen } from './SetupScreen'

const charades = games[0]

// A made-up Charades variant: 90-second turns and Mix it up, with rounds and the mode open, snacks only.
const variant: Variant = {
  id: 'snack-attack',
  name: 'Snack Attack',
  tagline: 'Tuck-shop favourites, acted out.',
  packs: ['back-to-school'],
  tags: ['snack'],
  settings: { seconds: 90, mode: 'mix' },
  open: ['rounds', 'mode'],
  freePlay: false,
  contributors: ['AdeizaSama'],
}

function renderSetup(onStart = vi.fn()) {
  render(
    <MemoryRouter>
      <SetupScreen game={charades} variant={variant} onStart={onStart} />
    </MemoryRouter>,
  )
  return onStart
}

describe('a variant’s setup screen', () => {
  beforeEach(() => localStorage.clear())

  it('shows the variant’s name, the teams and only its open settings, and starts with its settings and content', async () => {
    const user = userEvent.setup()
    const onStart = renderSetup()
    expect(screen.getByRole('heading', { level: 1, name: 'Snack Attack' })).toBeDefined()
    expect(screen.getByText('Tuck-shop favourites, acted out.')).toBeDefined()
    expect(screen.getByRole('textbox', { name: 'Team 1' })).toBeDefined()
    expect(screen.getByRole('group', { name: 'Rounds' })).toBeDefined()
    expect(screen.getByRole<HTMLInputElement>('radio', { name: /Mix it up/ }).checked).toBe(true)
    for (const hidden of ['Turn length', 'Packs', 'Only play']) expect(screen.queryByRole('heading', { name: hidden })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Advanced settings' })).toBeNull()

    await user.click(within(screen.getByRole('group', { name: 'Rounds' })).getByRole('button', { name: 'More: Rounds' }))
    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ rounds: 4, seconds: 90, mode: 'mix', packs: ['back-to-school'], tags: ['snack'], teams: ['Team 1', 'Team 2'] }),
    )
  })

  it('remembers what players changed, per variant, and only for open settings', async () => {
    const user = userEvent.setup()
    renderSetup()
    await user.click(screen.getByRole('radio', { name: /Describe/ }))
    expect(JSON.parse(localStorage.getItem('ku-zo-wasa:setup:charades/snack-attack') ?? 'null')).toMatchObject({ mode: 'describe' })
    expect(localStorage.getItem('ku-zo-wasa:setup:charades')).toBeNull()

    // A saved change to a closed setting (turn length), or to the content, is ignored.
    saveSetup(variantSetupId('charades', variant), { mode: 'describe', rounds: 5, seconds: 15, packs: ['other'], tags: [] } as never)
    expect(loadVariantSetup(charades, variant)).toMatchObject({ mode: 'describe', rounds: 5, seconds: 90, packs: ['back-to-school'], tags: ['snack'] })
  })
})
