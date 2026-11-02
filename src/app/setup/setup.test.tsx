// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { summarizeSave } from '../play/savedGame'
import { games } from '../registry'
import { defaultSetup, loadSetup, saveSetup } from './savedSetup'
import { loadTeams, saveTeams } from './savedTeams'

/** The app at an address, like a player opening a link. */
function renderAt(address: string) {
  return render(
    <MemoryRouter initialEntries={[address]}>
      <App />
    </MemoryRouter>,
  )
}

const charades = games[0]
const team = (n: number) => screen.getByRole<HTMLInputElement>('textbox', { name: `Team ${n}` })
const start = () => screen.getByRole<HTMLButtonElement>('button', { name: 'Start' })

describe('setup screen', () => {
  // happy-dom keeps localStorage between tests in a file; start each with nothing saved.
  beforeEach(() => localStorage.clear())

  it('starts with two teams and the default settings, and Start begins the game and remembers the teams', async () => {
    const user = userEvent.setup()
    renderAt('/charades')

    expect(team(1).value).toBe('Team 1')
    expect(team(2).value).toBe('Team 2')
    expect(within(screen.getByRole('group', { name: 'Rounds' })).getByText('3')).toBeDefined()
    expect(within(screen.getByRole('group', { name: 'Turn length' })).getByText('60 seconds')).toBeDefined()
    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: /Back to School/ }).checked).toBe(true)
    expect(screen.getByText('34 items to play')).toBeDefined()

    await user.clear(team(1))
    await user.type(team(1), 'Lions')
    await user.click(start())

    expect(screen.getByText('Pass the phone to')).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Lions' })).toBeDefined()
    expect(loadTeams()).toEqual(['Lions', 'Team 2'])
    const saved = summarizeSave()
    expect(saved.status === 'ok' && saved.summary.teams).toEqual(['Lions', 'Team 2'])
  })

  it('fills in the teams saved on this device, and ignores a save it can’t read', () => {
    saveTeams(['Lions', 'Eagles', 'Hawks'])
    renderAt('/charades')
    expect([team(1).value, team(2).value, team(3).value]).toEqual(['Lions', 'Eagles', 'Hawks'])

    localStorage.setItem('ku-zo-wasa:teams', '{not json')
    expect(loadTeams()).toBeUndefined()
    localStorage.setItem('ku-zo-wasa:teams', '["Only one"]')
    expect(loadTeams()).toBeUndefined()
  })

  it('adds and removes teams, from 2 up to 10', async () => {
    const user = userEvent.setup()
    renderAt('/charades')

    expect(screen.queryByRole('button', { name: /^Remove/ })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Add team' }))
    expect(team(3).value).toBe('Team 3')
    await user.click(screen.getByRole('button', { name: 'Remove Team 1' }))
    expect([team(1).value, team(2).value]).toEqual(['Team 2', 'Team 3'])

    for (let n = 3; n <= 10; n++) await user.click(screen.getByRole('button', { name: 'Add team' }))
    expect(team(10)).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Add team' })).toBeNull()
  })

  it('shows what’s wrong with a team name next to it, and Start is off until it’s fixed', async () => {
    const user = userEvent.setup()
    renderAt('/charades')

    await user.clear(team(1))
    expect(screen.getByText('Give every team a name')).toBeDefined()
    expect(team(1).getAttribute('aria-invalid')).toBe('true')
    expect(start().disabled).toBe(true)

    await user.type(team(1), 'team 2')
    expect(screen.getByText('Two teams have this name')).toBeDefined()
    expect(start().disabled).toBe(true)

    await user.type(team(1), 's')
    expect(start().disabled).toBe(false)
  })

  it('changes rounds and turn length with − and +, within their limits', async () => {
    const user = userEvent.setup()
    renderAt('/charades')
    const rounds = screen.getByRole('group', { name: 'Rounds' })
    const length = screen.getByRole('group', { name: 'Turn length' })

    await user.click(within(length).getByRole('button', { name: 'Less: Turn length' }))
    expect(within(length).getByText('45 seconds')).toBeDefined()
    await user.click(within(rounds).getByRole('button', { name: 'Less: Rounds' }))
    await user.click(within(rounds).getByRole('button', { name: 'Less: Rounds' }))
    expect(within(rounds).getByText('1')).toBeDefined()
    expect(within(rounds).getByRole<HTMLButtonElement>('button', { name: 'Less: Rounds' }).disabled).toBe(true)
  })

  it('counts the items a tag leaves, and needs at least one pack', async () => {
    const user = userEvent.setup()
    renderAt('/charades')

    await user.click(screen.getByRole('button', { name: 'snack' }))
    expect(screen.getByText('5 items to play')).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'song' }))
    expect(screen.getByText('7 items to play')).toBeDefined()

    await user.click(screen.getByRole('checkbox', { name: /Back to School/ }))
    expect(screen.getByText('Pick at least one pack')).toBeDefined()
    expect(screen.queryByRole('button', { name: 'snack' })).toBeNull()
    expect(start().disabled).toBe(true)
  })

  it('How to play opens the game’s rules, and Back to setup returns to setup', async () => {
    const user = userEvent.setup()
    renderAt('/charades')
    await user.click(screen.getByRole('link', { name: 'How to play' }))

    expect(screen.getByRole('heading', { name: 'How to play Charades' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'A turn' })).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Back to setup' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Charades' })).toBeDefined()
  })

  it('opens the rules from a link too, where Back to setup goes to setup; a game that doesn’t exist has no rules', async () => {
    const user = userEvent.setup()
    const { unmount } = renderAt('/charades/rules')
    await user.click(screen.getByRole('button', { name: 'Back to setup' }))
    expect(start()).toBeDefined()
    unmount()

    renderAt('/anime/rules')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeDefined()
  })

  it('sends the play page back to setup when there is no saved game, like a shared /charades/play link', () => {
    renderAt('/charades/play')
    expect(screen.getByRole('heading', { level: 1, name: 'Charades' })).toBeDefined()
    expect(start()).toBeDefined()
  })

  it('remembers setup choices as they are made, so leaving setup loses nothing', async () => {
    const user = userEvent.setup()
    const { unmount } = renderAt('/charades')
    await user.clear(team(1))
    await user.type(team(1), 'Lions')
    await user.click(within(screen.getByRole('group', { name: 'Rounds' })).getByRole('button', { name: 'More: Rounds' }))
    await user.click(within(screen.getByRole('group', { name: 'Turn length' })).getByRole('button', { name: 'More: Turn length' }))
    await user.click(screen.getByRole('button', { name: 'snack' }))
    unmount() // a back swipe, before Start

    renderAt('/charades')
    expect(team(1).value).toBe('Lions')
    expect(within(screen.getByRole('group', { name: 'Rounds' })).getByText('4')).toBeDefined()
    expect(within(screen.getByRole('group', { name: 'Turn length' })).getByText('75 seconds')).toBeDefined()
    expect(screen.getByRole('button', { name: 'snack' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('5 items to play')).toBeDefined()
  })

  it('drops remembered packs that no longer exist, and ignores choices that are no longer allowed', () => {
    const key = 'ku-zo-wasa:setup:charades'
    localStorage.setItem(key, JSON.stringify({ rounds: 5, seconds: 90, packs: ['back-to-school', 'removed-pack'], tags: [] }))
    expect(loadSetup(charades)).toEqual({ ...defaultSetup(charades), rounds: 5, seconds: 90, packs: ['back-to-school'] })

    localStorage.setItem(key, JSON.stringify({ rounds: 5, seconds: 90, packs: ['removed-pack'], tags: [] }))
    expect(loadSetup(charades)).toBeUndefined()
    localStorage.setItem(key, JSON.stringify({ rounds: 99, seconds: 90, packs: ['back-to-school'], tags: [] }))
    expect(loadSetup(charades)).toBeUndefined()
    localStorage.setItem(key, 'not json')
    expect(loadSetup(charades)).toBeUndefined()
  })

  it('shows the game’s own settings, keeps them in the draft, and Start plays them', async () => {
    const user = userEvent.setup()
    const { unmount } = renderAt('/charades')
    await user.click(screen.getByRole('radio', { name: /Mix it up/ }))
    await user.click(screen.getByRole('button', { name: 'Advanced settings' }))
    await user.click(screen.getByRole('button', { name: 'Less: Skipped' }))
    await user.click(screen.getByRole('button', { name: 'Done' }))
    unmount()

    renderAt('/charades')
    expect(screen.getByRole<HTMLInputElement>('radio', { name: /Mix it up/ }).checked).toBe(true)
    expect(screen.getByText('Describe 2 · Act 3 · Sing 3 · Skip 0')).toBeDefined()
    await user.click(start())
    const saved = JSON.parse(localStorage.getItem('ku-zo-wasa:game') ?? 'null')
    expect(saved.state.context.config).toMatchObject({ mode: 'mix', points: { describe: 2, act: 3, sing: 3, skip: 0 } })
  })

  it('offers the game’s presets: Classic is the defaults, a tap applies one whole, and any change unselects it', async () => {
    const user = userEvent.setup()
    renderAt('/charades')
    const preset = (name: string) => screen.getByRole('button', { name })
    const rounds = within(screen.getByRole('group', { name: 'Rounds' }))
    expect(preset('Classic').getAttribute('aria-pressed')).toBe('true')

    await user.click(screen.getByRole('button', { name: 'snack' }))
    await user.click(screen.getByRole('button', { name: 'Advanced settings' }))
    await user.click(screen.getByRole('button', { name: 'More: Acted' }))
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(preset('Classic').getAttribute('aria-pressed')).toBe('false')

    await user.click(preset('Party'))
    expect(preset('Party').getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole<HTMLInputElement>('radio', { name: /Mix it up/ }).checked).toBe(true)
    expect(screen.getByText('Describe 2 · Act 3 · Sing 3 · Skip −1')).toBeDefined()
    expect(screen.getByRole('button', { name: 'snack' }).getAttribute('aria-pressed')).toBe('true')

    await user.click(preset('Quick'))
    expect(rounds.getByText('2')).toBeDefined()
    expect(within(screen.getByRole('group', { name: 'Turn length' })).getByText('45 seconds')).toBeDefined()
    expect(screen.getByRole<HTMLInputElement>('radio', { name: /Describe/ }).checked).toBe(true)
    await user.click(rounds.getByRole('button', { name: 'More: Rounds' }))
    expect(screen.getAllByRole('button', { pressed: true }).map((button) => button.textContent)).toEqual(['snack'])
  })

  it('keeps the game’s own settings in the draft, and gives a setting added since the save its default', () => {
    const mix = { ...defaultSetup(charades), mode: 'mix' as const, points: { describe: 1, act: 4, sing: 5, skip: 0 } }
    saveSetup('charades', mix)
    expect(loadSetup(charades)).toEqual(mix)

    // Saved before Charades had modes and points (chapter 05).
    localStorage.setItem('ku-zo-wasa:setup:charades', JSON.stringify({ rounds: 5, seconds: 90, packs: ['back-to-school'], tags: [] }))
    expect(loadSetup(charades)).toMatchObject({ rounds: 5, mode: 'describe', points: { describe: 2, act: 3, sing: 3, skip: 1 } })

    // A setting the game no longer has.
    localStorage.setItem('ku-zo-wasa:setup:charades', JSON.stringify({ ...mix, punishSkips: true }))
    expect(loadSetup(charades)).toBeUndefined()
  })
})
