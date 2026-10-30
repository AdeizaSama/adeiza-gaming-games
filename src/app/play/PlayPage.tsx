import { useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { choosePoolItems } from '../../sdk/formats/team-turns/pool'
import { NotFoundPage } from '../NotFoundPage'
import { findGame } from '../registry'
import { GameScreen } from './GameScreen'
import { clearGame, loadGame, saveGame } from './savedGame'

/**
 * `/:gameId/play`: plays this game's save (ADR 0006). Arriving from Start, from Continue, or by a refresh is all the
 * same: load the save and carry on. With no save for this game, back to its setup screen.
 */
export function PlayPage() {
  const { gameId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const game = findGame(gameId)
  // Read once when the page opens, not on every render: loading can delete a stale save.
  const [saved] = useState(() => (game ? loadGame(game) : undefined))
  if (!game || !saved) return <NotFoundPage />
  // A save that had to be thrown away: the library says so. No save for this game: its setup screen.
  if (saved.status === 'discarded') return <Navigate to="/" replace state={{ discarded: saved.reason }} />
  if (saved.status !== 'ok') return <Navigate to={`/${game.meta.id}`} replace />

  const { config } = saved.state.context
  // For Play again: the same settings, and the items they choose today.
  const input = { config, items: choosePoolItems(game.content.packs, config, game.content.itemKey) }
  return (
    <GameScreen
      key={location.key}
      game={game}
      initial={saved.state}
      input={input}
      options={{ onChange: (state) => saveGame(game, state) }}
      onQuit={() => {
        clearGame()
        navigate('/')
      }}
    />
  )
}
