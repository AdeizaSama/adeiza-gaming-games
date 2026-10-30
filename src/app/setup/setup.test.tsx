// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { summarizeSave } from '../play/savedGame'
import { loadTeams, saveTeams } from './savedTeams'

/** The app at an address, like a player opening a link. */
function renderAt(address: string) {
  return render(
    <MemoryRouter initialEntries={[address]}>
      <App />
    </MemoryRouter>,
  )
}

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

  it('sends the play page back to setup when there is no saved game, like a shared /charades/play link', () => {
    renderAt('/charades/play')
    expect(screen.getByRole('heading', { level: 1, name: 'Charades' })).toBeDefined()
    expect(start()).toBeDefined()
  })
})
