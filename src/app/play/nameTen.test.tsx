// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

describe('playing Name Ten', () => {
  // As in the Charades screen tests: a fake clock for the countdown, real timeouts for Testing Library.
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    vi.setSystemTime(0)
  })
  afterEach(() => vi.useRealTimers())

  it('goes from setup to a judge, a board, review and the summary, by tapping', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/name-ten']}>
        <App />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Start' }))

    // The phone goes to a judge from the other team.
    expect(screen.getByText('Hand the phone to a judge from')).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Team 2' })).toBeDefined()
    expect(screen.getByText('Team 1 are up · Round 1 of 3')).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Start' }))

    // The board: ten answers; the judge ticks two, then ends the turn early.
    const answers = within(screen.getByRole('list', { name: 'Answers' })).getAllByRole('button')
    expect(answers).toHaveLength(10)
    await user.click(answers[0])
    await user.click(answers[1])
    expect(screen.getByText('2 of 10')).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'End turn early' }))

    // Review: the board, locked; Adjust, count a third answer; Done.
    expect(screen.getByText('Check the answers before they count.')).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Adjust' }))
    const rows = within(screen.getByRole('list', { name: 'Answers this turn' })).getAllByRole('button')
    await user.click(rows[2])
    await user.click(screen.getByRole('button', { name: 'Done' }))

    expect(screen.getByText(/scored/).textContent).toContain('3')
    const standings = within(screen.getByRole('list', { name: 'Scores so far' })).getAllByRole('listitem')
    expect(standings.map((row) => row.textContent)).toEqual(['Team 13', 'Team 20'])
  })
})
