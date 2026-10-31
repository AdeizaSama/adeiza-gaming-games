import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { choosePoolItems } from '../../sdk/formats/team-turns/pool'
import { newGame } from '../../sdk/game/useGameSession'
import { Button } from '../../ui/button'
import { Dialog } from '../../ui/dialog'
import { NotFoundPage } from '../NotFoundPage'
import { describeSave, saveGame, summarizeSave, type SaveSummary } from '../play/savedGame'
import { findGame } from '../registry'
import { saveTeams } from './savedTeams'
import { SetupScreen } from './SetupScreen'

/**
 * `/:gameId`: the game's setup screen. Start creates the game, saves it, and goes to `/:gameId/play`, which plays
 * the save (ADR 0006). Nothing is passed along: the save is the only way a game reaches the play page.
 *
 * There's one save per device, so if an unfinished game is saved, Start asks before replacing it.
 */
export function SetupPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const game = findGame(gameId)
  // The settings waiting for an answer to "Replace your saved game?", and the game they'd replace.
  const [pending, setPending] = useState<{ start: () => void; replacing: SaveSummary }>()
  if (!game) return <NotFoundPage />

  return (
    <>
      <SetupScreen
        key={game.meta.id}
        game={game}
        onStart={(config) => {
          const start = () => {
            const items = choosePoolItems(game.content.packs, config, game.content.itemKey)
            saveTeams(config.teams)
            saveGame(game, newGame(game.machine, { config, items }))
            navigate(`/${game.meta.id}/play`)
          }
          const saved = summarizeSave()
          if (saved.status === 'ok' && !saved.summary.finished) setPending({ start, replacing: saved.summary })
          else start()
        }}
      />
      {pending && (
        <Dialog
          open
          onClose={() => setPending(undefined)}
          title="Replace your saved game?"
          description={`Your ${pending.replacing.game.meta.name} game (${describeSave(pending.replacing)}) will be lost.`}
        >
          <Button variant="destructive" onClick={pending.start}>
            Start new game
          </Button>
          <Button variant="outline" onClick={() => navigate(`/${pending.replacing.game.meta.id}/play`)}>
            Continue saved game
          </Button>
        </Dialog>
      )}
    </>
  )
}
