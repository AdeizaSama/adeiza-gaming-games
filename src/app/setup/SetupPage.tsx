import { useNavigate, useParams } from 'react-router'
import { choosePoolItems } from '../../sdk/formats/team-turns/pool'
import { newGame } from '../../sdk/game/useGameSession'
import { NotFoundPage } from '../NotFoundPage'
import { saveGame } from '../play/savedGame'
import { findGame } from '../registry'
import { saveTeams } from './savedTeams'
import { SetupScreen } from './SetupScreen'

/**
 * `/:gameId`: the game's setup screen. Start creates the game, saves it, and goes to `/:gameId/play`, which plays
 * the save (ADR 0006). Nothing is passed along: the save is the only way a game reaches the play page.
 */
export function SetupPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const game = findGame(gameId)
  if (!game) return <NotFoundPage />

  return (
    <SetupScreen
      key={game.meta.id}
      game={game}
      onStart={(config) => {
        const items = choosePoolItems(game.content.packs, config, game.content.itemKey)
        saveTeams(config.teams)
        saveGame(game, newGame(game.machine, { config, items }))
        navigate(`/${game.meta.id}/play`)
      }}
    />
  )
}
