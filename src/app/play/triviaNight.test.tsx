// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

describe('playing Trivia Night', () => {
  // As in the Charades screen tests: a fake clock for the countdown, real timeouts for Testing Library.
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    vi.setSystemTime(0)
  })
  afterEach(() => vi.useRealTimers())

  it('goes from setup to a question, its result and the summary, by tapping', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/trivia-night']}>
        <App />
      </MemoryRouter>,
    )
    // Two questions a turn.
    await user.click(within(screen.getByRole('group', { name: 'Questions per turn' })).getByRole('button', { name: 'More: Questions per turn' }))
    await user.click(screen.getByRole('button', { name: 'Start' }))

    // The format's handoff: the phone goes to the team playing.
    expect(screen.getByRole('heading', { name: 'Team 1' })).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Start' }))

    // Two questions: pick the first option each time. The result appears, then the next question, then the end.
    for (const [count, next] of [['Question 1 of 2', 'Next question'], ['Question 2 of 2', 'End turn']]) {
      expect(screen.getByText(count)).toBeDefined()
      const options = within(screen.getByRole('list', { name: 'Options' })).getAllByRole('button')
      expect(options.length).toBeGreaterThanOrEqual(2)
      await user.click(options[0])
      expect(screen.getByText(/^(Right!|Not quite: it's .+\.)$/)).toBeDefined()
      await user.click(screen.getByRole('button', { name: next }))
    }

    expect(screen.getByText(/scored/)).toBeDefined()
    const standings = within(screen.getByRole('list', { name: 'Scores so far' })).getAllByRole('listitem')
    expect(standings).toHaveLength(2)
  })
})
