// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MultipleChoice, resultText } from './MultipleChoice'

const options = ['Lagos', 'Abuja', 'Kano', 'Ibadan']

/** The card with the machine's part played by a bit of state: the first tap is the pick. */
function Question({ onPick = () => {} }: { onPick?: (index: number) => void }) {
  const [picked, setPicked] = useState<number | null>(null)
  return (
    <MultipleChoice
      question="What is the capital of Nigeria?"
      options={options}
      answer={1}
      picked={picked}
      onPick={(index) => {
        onPick(index)
        setPicked(index)
      }}
    />
  )
}

const option = (name: string) => within(screen.getByRole('list', { name: 'Options' })).getByRole('button', { name: new RegExp(`^${name}`) })

describe('MultipleChoice', () => {
  it('shows the question with its label on the card, and every option in order, none marked', () => {
    render(<Question />)
    expect(screen.getByText('Question')).toBeDefined()
    expect(screen.getByRole('heading', { name: 'What is the capital of Nigeria?' }).closest('[data-feature]')).not.toBeNull()
    const buttons = within(screen.getByRole('list', { name: 'Options' })).getAllByRole('button')
    expect(buttons.map((button) => button.textContent)).toEqual(options)
    expect(buttons.map((button) => button.dataset.variant)).toEqual(['outline', 'outline', 'outline', 'outline'])
  })

  it('reports the tap, then shows the answer in green and a wrong pick in red, and ignores later taps', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<Question onPick={onPick} />)
    await user.click(option('Lagos'))
    expect(onPick).toHaveBeenCalledWith(0)
    expect(screen.getByText("Not quite: it's Abuja.")).toBeDefined()
    expect(option('Abuja').dataset.variant).toBe('success')
    expect(option('Lagos').dataset.variant).toBe('destructive')
    expect(option('Kano').dataset.variant).toBe('outline')
    expect(screen.getByLabelText('The answer')).toBeDefined()
    expect(screen.getByLabelText('Your pick')).toBeDefined()
    await user.click(option('Abuja'))
    expect(onPick).toHaveBeenCalledTimes(1)
  })

  it('says Right! when the pick is the answer, and takes 2 or 5 options', () => {
    expect(resultText(options, 1, 1)).toBe('Right!')
    expect(resultText(options, 1, 3)).toBe("Not quite: it's Abuja.")
    render(<MultipleChoice label="Gender" question="Table" options={['Masculin', 'Féminin']} answer={1} picked={1} onPick={() => {}} />)
    expect(screen.getByText('Gender')).toBeDefined()
    expect(screen.getByText('Right!')).toBeDefined()
    expect(within(screen.getByRole('list', { name: 'Options' })).getAllByRole('button')).toHaveLength(2)
  })
})

describe('MultipleChoice layout', () => {
  it('shares the height about 65 : 35, with options at least 44px and the question giving way', () => {
    render(<Question />)
    // Class names, because happy-dom doesn't lay pages out: this pins the layout ADR 0015 chose.
    const card = screen.getByRole('heading', { name: 'What is the capital of Nigeria?' }).closest('[data-feature]')!
    expect(card.className).toContain('flex-[13_1_0%]')
    expect(card.className).toContain('min-h-0')
    const list = screen.getByRole('list', { name: 'Options' })
    expect(list.className).toContain('flex-[7_0_0%]')
    expect(within(list).getAllByRole('listitem').every((item) => item.className.includes('min-h-11'))).toBe(true)
  })
})
