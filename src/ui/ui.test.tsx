// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './button'
import { cn } from './cn'
import { Input } from './input'

describe('cn', () => {
  it('drops empty values and lets a later class win over an earlier one that sets the same thing', () => {
    expect(cn('bg-primary px-4', false, undefined, 'bg-secondary')).toBe('px-4 bg-secondary')
  })
})

describe('Button', () => {
  it('is a button that does not submit forms unless asked to', () => {
    render(<Button>Start</Button>)
    expect(screen.getByRole('button', { name: 'Start' }).getAttribute('type')).toBe('button')
  })

  it('calls onClick when tapped, and not when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { rerender } = render(<Button onClick={onClick}>Got it</Button>)
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onClick).toHaveBeenCalledTimes(1)

    rerender(<Button onClick={onClick} disabled>Got it</Button>)
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('uses theme colors for its variant, and lets the caller adjust it', () => {
    render(<Button variant="success" className="w-full">Got it</Button>)
    const button = screen.getByRole('button', { name: 'Got it' })
    expect(button.className).toContain('bg-success')
    expect(button.className).toContain('w-full')
  })
})

describe('Input', () => {
  it('is a text field that can be found by its label and typed into', async () => {
    const user = userEvent.setup()
    render(
      <label>
        Team 1
        <Input />
      </label>,
    )
    const field = screen.getByRole('textbox', { name: 'Team 1' })
    await user.type(field, 'Lions')
    expect((field as HTMLInputElement).value).toBe('Lions')
  })
})
