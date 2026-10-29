// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('starts the demo game at the first team’s handoff', () => {
    render(<App />)
    expect(screen.getByText('Pass the phone to')).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Lions' })).toBeDefined()
  })
})
