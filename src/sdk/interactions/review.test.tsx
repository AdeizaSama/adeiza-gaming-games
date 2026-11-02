// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Review, type ReviewRow } from './Review'

const rows: ReviewRow[] = [
  { text: 'Gala', detail: 'Acted', result: 'Got it', tone: 'good' },
  { text: 'Zobo', result: 'Skipped', tone: 'bad', changed: true },
  { text: 'Assembly', result: 'Not counted', tone: 'none' },
]

const items = () => within(screen.getByRole('list', { name: 'Cards this turn' })).getAllByRole('listitem')

describe('Review', () => {
  it('lists every card with its result, locked: tapping a card does nothing', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<Review title="Lions" rows={rows} onToggle={onToggle} onDone={() => {}} />)

    expect(screen.getByRole('heading', { name: 'Lions' })).toBeDefined()
    expect(items().map((item) => item.textContent)).toEqual(['GalaActedGot it', 'ZoboSkippedchanged', 'AssemblyNot counted'])
    expect(within(items()[0]).queryByRole('button')).toBeNull()
    await user.click(screen.getByText('Gala'))
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('Adjust unlocks the cards, a tap reports which one, and Lock locks them again', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<Review title="Lions" rows={rows} onToggle={onToggle} onDone={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Adjust' }))
    expect(screen.getByText('Tap a card to change its result.')).toBeDefined()
    await user.click(within(items()[2]).getByRole('button'))
    expect(onToggle).toHaveBeenCalledWith(2)

    await user.click(screen.getByRole('button', { name: 'Lock' }))
    expect(within(items()[2]).queryByRole('button')).toBeNull()
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('Done finishes the review, locked or not, and an empty turn has nothing to adjust', async () => {
    const user = userEvent.setup()
    const onDone = vi.fn()
    const { unmount } = render(<Review title="Lions" rows={rows} onToggle={() => {}} onDone={onDone} doneLabel="Count it" />)
    await user.click(screen.getByRole('button', { name: 'Count it' }))
    await user.click(screen.getByRole('button', { name: 'Adjust' }))
    await user.click(screen.getByRole('button', { name: 'Count it' }))
    expect(onDone).toHaveBeenCalledTimes(2)
    unmount()

    render(<Review title="Eagles" rows={[]} onToggle={() => {}} onDone={() => {}} />)
    expect(screen.getByText('Nothing was played this turn.')).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Adjust' })).toBeNull()
  })
})
