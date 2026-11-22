// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Variant } from '../../sdk/content/variant'
import { choiceFreePlay } from '../../sdk/formats/team-turns/choice/FreePlayView'
import { games } from '../registry'
import { loadVariantSetup, saveSetup, variantSetupId } from './savedSetup'
import { SetupScreen } from './SetupScreen'

const charades = games[0]

// A made-up Charades variant: 90-second turns and Mix it up, with rounds and the mode open, snacks only.
const variant: Variant = {
  id: 'snack-attack',
  name: 'Snack Attack',
  tagline: 'Tuck-shop favourites, acted out.',
  categories: ['party'],
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

describe('a variant’s setup with Free Play', () => {
  beforeEach(() => localStorage.clear())

  // Trivia Night, given the choice turn's Free Play, and a variant that offers it.
  const trivia = games[2]
  const game = { ...trivia, config: { ...trivia.config, freePlay: choiceFreePlay } }
  const solo: Variant = { ...variant, id: 'quiz', name: 'Quiz', settings: {}, tags: [], open: ['rounds'], freePlay: true }

  function renderFreePlay(onStart = vi.fn()) {
    const view = render(
      <MemoryRouter>
        <SetupScreen game={game} variant={solo} onStart={onStart} />
      </MemoryRouter>,
    )
    return { onStart, ...view }
  }

  it('offers Competitive and Free Play; Free Play asks only for its length and starts one player, one round, no clock', async () => {
    const user = userEvent.setup()
    const { onStart } = renderFreePlay()
    const tab = (name: string) => screen.getByRole('tab', { name })
    expect(tab('Competitive').getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('textbox', { name: 'Team 1' })).toBeDefined()

    await user.click(tab('Free Play'))
    expect(tab('Free Play').getAttribute('aria-selected')).toBe('true')
    expect(screen.queryByRole('textbox', { name: 'Team 1' })).toBeNull()
    expect(screen.queryByRole('group', { name: 'Rounds' })).toBeNull()
    expect(screen.getByRole<HTMLInputElement>('radio', { name: /10 questions/ }).checked).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ solo: true, teams: ['You'], rounds: 1, mode: 'questions', questions: 10, timer: false, packs: ['back-to-school'] }),
    )
  })

  it('remembers the tab and Free Play’s own choices, apart from Competitive’s', async () => {
    const user = userEvent.setup()
    const { unmount } = renderFreePlay()
    await user.click(screen.getByRole('tab', { name: 'Free Play' }))
    await user.click(screen.getByRole('radio', { name: /20 questions/ }))
    unmount()

    renderFreePlay()
    expect(screen.getByRole('tab', { name: 'Free Play' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole<HTMLInputElement>('radio', { name: /20 questions/ }).checked).toBe(true)
    expect(JSON.parse(localStorage.getItem('ku-zo-wasa:setup:trivia-night/quiz') ?? '{}').questions).not.toBe(20)
  })

  it('shows no tabs on a variant that doesn’t offer Free Play', () => {
    render(
      <MemoryRouter>
        <SetupScreen game={game} variant={{ ...solo, freePlay: false }} onStart={() => {}} />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('tablist')).toBeNull()
  })
})
