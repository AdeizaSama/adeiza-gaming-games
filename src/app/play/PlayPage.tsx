import { Navigate, useLocation, useParams } from 'react-router'
import { choosePoolItems } from '../../sdk/formats/team-turns/pool'
import { newGame } from '../../sdk/game/useGameSession'
import { NotFoundPage } from '../NotFoundPage'
import { findGame } from '../registry'
import { GameScreen } from './GameScreen'

/**
 * `/:gameId/play`: plays the game with the settings the setup screen sent.
 *
 * Arriving without them (a typed or shared address) goes back to setup. The settings are checked again here: the
 * navigation state comes from outside this page and could be from an older version of the app.
 */
export function PlayPage() {
  const { gameId } = useParams()
  const location = useLocation()
  const game = findGame(gameId)
  if (!game) return <NotFoundPage />

  const settings = game.config.schema.safeParse(location.state?.config)
  if (!settings.success) return <Navigate to={`/${game.meta.id}`} replace />

  const input = { config: settings.data, items: choosePoolItems(game.content.packs, settings.data, game.content.itemKey) }
  // key: each Start is its own visit, so it gets a new session. The session keeps the first render's new game.
  return <GameScreen key={location.key} game={game} initial={newGame(game.machine, input)} input={input} />
}
