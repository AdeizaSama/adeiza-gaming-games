import { useNavigate, useParams } from 'react-router'
import { NotFoundPage } from '../NotFoundPage'
import { findGame } from '../registry'
import { saveTeams } from './savedTeams'
import { SetupScreen } from './SetupScreen'

/**
 * `/:gameId`: the game's setup screen. Start remembers the team names and goes to `/:gameId/play`, carrying the
 * settings in the router's navigation state (not in the address: they'd make it long and editable by hand).
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
        saveTeams(config.teams)
        navigate(`/${game.meta.id}/play`, { state: { config } })
      }}
    />
  )
}
