// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { PromptCard } from './PromptCard'

const texts = ['Biro', 'Ruler', 'Eraser']

/** The card with the machine's part played by a bit of state: a tap ticks or unticks an answer. */
function Board() {
  const [on, setOn] = useState([false, true, false])
  return (
    <PromptCard
      prompt="Things Found in a School Bag"
      answers={texts.map((text, index) => ({ text, on: on[index] }))}
      onToggle={(index) => setOn(on.map((value, i) => (i === index ? !value : value)))}
    />
  )
}

const answer = (name: string) => within(screen.getByRole('list', { name: 'Answers' })).getByRole('button', { name })

describe('PromptCard', () => {
  it('shows the prompt with its label and a running count, and every answer with whether it’s ticked', () => {
    render(<Board />)
    expect(screen.getByText('Category')).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Things Found in a School Bag' }).closest('[data-feature]')).not.toBeNull()
    expect(screen.getByText('1 of 3')).toBeDefined()
    expect(texts.map((text) => answer(text).getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false'])
  })

  it('reports which answer was tapped, and the count follows', async () => {
    const user = userEvent.setup()
    render(<Board />)
    await user.click(answer('Biro'))
    await user.click(answer('Eraser'))
    expect(screen.getByText('3 of 3')).toBeDefined()
    await user.click(answer('Ruler'))
    expect(screen.getByText('2 of 3')).toBeDefined()
    expect(answer('Ruler').getAttribute('aria-pressed')).toBe('false')

    const onToggle = vi.fn()
    render(<PromptCard label="Question" prompt="Pick" answers={[{ text: 'A', on: false }]} onToggle={onToggle} />)
    expect(screen.getByText('Question')).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'A' }))
    expect(onToggle).toHaveBeenCalledWith(0)
  })
})

describe('PromptCard layout', () => {
  it('lays the board out as two columns of tiles that share the height, never under 44px, scrolling only then', () => {
    render(<Board />)
    const board = screen.getByRole('list', { name: 'Answers' })
    // Class names, because happy-dom doesn't lay pages out: this pins the layout ADR 0013 chose.
    expect(board.className).toMatch(/\bgrid-cols-2\b/)
    expect(board.className).toContain('auto-rows-[minmax(2.75rem,1fr)]')
    expect(board.className).toContain('overflow-y-auto')
  })
})
