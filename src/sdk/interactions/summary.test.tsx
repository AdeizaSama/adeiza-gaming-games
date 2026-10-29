// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Leaderboard, rank } from './Leaderboard'
import { Summary } from './Summary'

describe('Summary', () => {
  it('shows who played, what they scored, and each list of items', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    render(
      <Summary
        title="Lions"
        points={2}
        sections={[
          { label: 'Got it', items: ['Gala', 'Zobo'] },
          { label: 'Skipped', items: ['Assembly'] },
        ]}
        onNext={onNext}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Lions' })).toBeDefined()
    expect(screen.getByText(/scored/).textContent).toBe('scored 2 points')
    expect(within(screen.getByRole('list', { name: 'Got it' })).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Gala', 'Zobo'])
    expect(within(screen.getByRole('list', { name: 'Skipped' })).getAllByRole('listitem')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('says "1 point", and leaves out empty lists', () => {
    render(<Summary title="Eagles" points={1} sections={[{ label: 'Skipped', items: [] }]} onNext={() => {}} />)
    expect(screen.getByText(/scored/).textContent).toBe('scored 1 point')
    expect(screen.queryByRole('list')).toBeNull()
  })
})

describe('rank', () => {
  it('orders by score, gives tied scores the same place and skips the next, keeping tied entries in order', () => {
    const entries = [
      { name: 'A', score: 7 },
      { name: 'B', score: 10 },
      { name: 'C', score: 10 },
      { name: 'D', score: 3 },
    ]
    expect(rank(entries).map((e) => `${e.place} ${e.name}`)).toEqual(['1 B', '1 C', '3 A', '4 D'])
    expect(entries[0].name).toBe('A')
  })
})

describe('Leaderboard', () => {
  it('lists every team with its place and score, highest first, highlighting first place', () => {
    render(
      <Leaderboard
        entries={[
          { name: 'Lions', score: 4 },
          { name: 'Eagles', score: 9 },
        ]}
      />,
    )
    const rows = within(screen.getByRole('list', { name: 'Standings' })).getAllByRole('listitem')
    expect(rows.map((row) => row.textContent)).toEqual(['1Eagles9', '2Lions4'])
    expect(rows[0].className).toContain('bg-primary')
    expect(rows[1].className).not.toContain('bg-primary')
  })
})
