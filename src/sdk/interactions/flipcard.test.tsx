// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FlipCard } from './FlipCard'

describe('FlipCard', () => {
  it('shows the front and Show the answer; after the flip, the back, Not yet and Knew it', async () => {
    const user = userEvent.setup()
    const onKnew = vi.fn()
    const onNotYet = vi.fn()
    function Card() {
      const [flipped, setFlipped] = useState(false)
      return <FlipCard label="French" front="le chat" back="cat" flipped={flipped} onFlip={() => setFlipped(true)} onKnew={onKnew} onNotYet={onNotYet} />
    }
    render(<Card />)
    expect(screen.getByText('French')).toBeDefined()
    expect(screen.getByText('le chat').closest('[data-feature]')).not.toBeNull()
    expect(screen.queryByText('cat')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Knew it' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Show the answer' }))
    expect(screen.getByText('cat')).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Show the answer' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Not yet' }))
    await user.click(screen.getByRole('button', { name: 'Knew it' }))
    expect([onNotYet.mock.calls.length, onKnew.mock.calls.length]).toEqual([1, 1])
  })
})
