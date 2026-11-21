// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { PickCard, pickResult } from './PickCard'

const options = ['cat', 'dog', 'house', 'tree', 'car']
const answers = [0, 1, 2]

/** The card with the machine's part played by a bit of state: taps toggle, Check shows the result. */
function Card() {
  const [picked, setPicked] = useState<number[]>([])
  const [checked, setChecked] = useState(false)
  return (
    <PickCard
      label="Find their partners"
      prompts={['le chat', 'le chien', 'la maison']}
      options={options}
      need={3}
      picked={picked}
      answers={answers}
      checked={checked}
      onPick={(index) => setPicked((current) => (current.includes(index) ? current.filter((i) => i !== index) : [...current, index]))}
      onCheck={() => setChecked(true)}
    />
  )
}

const tile = (name: string) => within(screen.getByRole('list', { name: 'Tiles' })).getByRole('button', { name: new RegExp(`^${name}`) })

describe('PickCard', () => {
  it('shows the prompts and tiles, picks up to the number needed, and checks only when enough are picked', async () => {
    const user = userEvent.setup()
    render(<Card />)
    const prompts = within(screen.getByRole('list', { name: 'Prompts' })).getAllByRole('listitem')
    expect(prompts.map((item) => item.textContent)).toEqual(['le chat', 'le chien', 'la maison'])
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Check' }).disabled).toBe(true)
    await user.click(tile('cat'))
    await user.click(tile('cat'))
    expect(tile('cat').getAttribute('aria-pressed')).toBe('false')
    for (const name of ['cat', 'dog', 'tree']) await user.click(tile(name))
    await user.click(tile('car')) // a fourth: ignored
    expect(tile('car').getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByText('3 of 3 picked')).toBeDefined()
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Check' }).disabled).toBe(false)
  })

  it('after Check: right picks green, wrong red, missed ones outlined, the rest faded, and the count right', async () => {
    const user = userEvent.setup()
    render(<Card />)
    for (const name of ['cat', 'dog', 'tree']) await user.click(tile(name))
    await user.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByText('2 of 3 right')).toBeDefined()
    expect([tile('cat'), tile('dog'), tile('tree'), tile('house')].map((button) => button.dataset.variant)).toEqual([
      'success',
      'success',
      'destructive',
      'outline',
    ])
    expect(tile('house').className).toContain('border-success')
    expect(screen.getByLabelText('Missed')).toBeDefined()
    expect(tile('car').className).toContain('opacity-50')
    expect(screen.queryByRole('button', { name: 'Check' })).toBeNull()
    expect(pickResult([3, 4, 0], answers)).toBe('1 of 3 right')
  })
})
