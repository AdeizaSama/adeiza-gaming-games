import { useLocation, useNavigate, useParams } from 'react-router'
import { Instruction } from '../../sdk/interactions/Instruction'
import { NotFoundPage } from '../NotFoundPage'
import { findGame } from '../registry'

/**
 * `/:gameId/rules`: how to play, from the game's `rules.md` (ADR 0009). Its own page rather than a dialog, so long
 * rules scroll like any page and a back swipe returns to setup.
 */
export function RulesPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const game = findGame(gameId)
  if (!game) return <NotFoundPage />

  // Opened from setup: go back, so setup isn't twice in the history. Opened from a link: go to setup.
  const fromSetup = (location.state as { fromSetup?: boolean } | null)?.fromSetup === true
  const back = () => (fromSetup ? navigate(-1) : navigate(`/${game.meta.id}`, { replace: true }))

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <Instruction title={`How to play ${game.meta.name}`} text={game.rules} actionLabel="Back to setup" onAction={back} />
    </main>
  )
}
