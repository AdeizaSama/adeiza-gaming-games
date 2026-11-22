// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { findGame, images } from '../registry'
import { cardImage, indexImages } from '../registry/images'
import { GameCard, standIn } from './GameCard'

const charades = findGame('charades')!
const pairs = findGame('pairs')!
const games = [charades, pairs]

describe('card pictures', () => {
  it('finds each game’s picture and its variants’, by file name', () => {
    const index = indexImages(
      {
        '../../games/charades/images/game.webp': '/assets/game-1.webp',
        '../../games/charades/images/naija-back-to-school.png': '/assets/naija-2.png',
        '../../games/pairs/images/french-match-up.webp': '/assets/match-3.webp',
      },
      games,
    )
    expect(index.problems).toEqual([])
    expect(cardImage(index, charades, 'naija-back-to-school')).toBe('/assets/naija-2.png') // its own
    expect(cardImage(index, charades)).toBe('/assets/game-1.webp') // the game's own card
    expect(cardImage(index, pairs, 'french-match-up')).toBe('/assets/match-3.webp')
    expect(cardImage(index, pairs, 'l-intrus')).toBeUndefined() // no picture of its own, and Pairs has none
  })

  it('reports a picture named after nothing, outside a game, or a second one with the same name', () => {
    const { problems } = indexImages(
      {
        '../../games/charades/images/naija.webp': 'a',
        '../../games/chess/images/game.webp': 'b',
        '../../games/charades/images/game.webp': 'c',
        '../../games/charades/images/game.png': 'd',
      },
      games,
    )
    expect(problems).toEqual([
      "../../games/charades/images/naija.webp: name it game, or after one of Charades's variants: naija-back-to-school",
      "../../games/chess/images/game.webp: not in a game's images folder",
      '../../games/charades/images/game.png: charades already has a picture called game',
    ])
  })

  it('has no picture in the games’ folders named after nothing', () => {
    expect(images.problems).toEqual([])
  })
})

/** Shows the back link the card passed along, on the page it opens. */
function Opened() {
  const back = useLocation().state?.back
  return <p>Back to {back?.label} at {back?.to}</p>
}

describe('GameCard', () => {
  it('shows its picture, or the game’s icon on theme colors, and tells the setup where to go back to', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ul>
                <GameCard to="/charades/naija-back-to-school" game={charades} name="Naija Charades" tagline="Act it out." detail="Charades" image="/naija.webp" back={{ to: '/games?category=naija', label: 'Games' }} />
                <GameCard to="/pairs" game={pairs} name="Pairs" tagline="Learn words." detail="Pairs" back={{ to: '/custom', label: 'Custom game' }} />
              </ul>
            }
          />
          <Route path="*" element={<Opened />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/naija.webp')
    const standInArt = container.querySelector('[data-stand-in]')!
    expect(standInArt.className).toContain(standIn('pairs'))
    expect(standInArt.querySelector('.lucide-layers')).not.toBeNull()
    expect(standIn('pairs')).toBe(standIn('pairs'))

    await user.click(screen.getByRole('link', { name: /Naija Charades/ }))
    expect(screen.getByText('Back to Games at /games?category=naija')).toBeDefined()
  })
})
