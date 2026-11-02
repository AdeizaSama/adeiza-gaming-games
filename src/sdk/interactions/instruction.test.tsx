// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Instruction } from './Instruction'

describe('Instruction', () => {
  it('shows the title and the text as headings, paragraphs, lists and bold, and the button carries on', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(<Instruction title="How to play" text={'## A turn\nAct it **out**.\n\n1. Start\n2. Got it'} onAction={onAction} />)

    expect(screen.getByRole('heading', { level: 2, name: 'How to play' })).toBeDefined()
    expect(screen.getByRole('heading', { level: 4, name: 'A turn' })).toBeDefined()
    expect(screen.getByText('out').tagName).toBe('STRONG')
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Start', 'Got it'])
    expect(screen.getByRole('list').tagName).toBe('OL')

    await user.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onAction).toHaveBeenCalledOnce()
  })

  it('never turns text into HTML', () => {
    const { container } = render(<Instruction title="Rules" text={'A <b>tag</b> and <img src=x onerror=alert(1)>'} onAction={() => {}} />)
    expect(container.querySelector('b, img')).toBeNull()
    expect(screen.getByText('A <b>tag</b> and <img src=x onerror=alert(1)>')).toBeDefined()
  })
})
