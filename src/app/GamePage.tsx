import { useParams } from 'react-router'
import { TeamTurnsConfig } from '../sdk/formats/team-turns/config'
import { choosePoolItems } from '../sdk/formats/team-turns/pool'
import { NotFoundPage } from './NotFoundPage'
import { GameScreen } from './play/GameScreen'
import { findGame } from './registry'

/**
 * `/:gameId`: the game named in the address. Until the setup screen (step 11) it plays a fixed demo game:
 * Lions vs Eagles, 1 round, 30-second turns, every pack.
 */
export function GamePage() {
  const { gameId } = useParams()
  const game = findGame(gameId)
  if (!game) return <NotFoundPage />

  const config = TeamTurnsConfig.parse({
    teams: ['Lions', 'Eagles'],
    rounds: 1,
    seconds: 30,
    packs: game.content.packs.map((pack) => pack.id),
  })
  const items = choosePoolItems(game.content.packs, config, game.content.itemKey)
  // key: a different game in the address starts a new session instead of keeping the last game's.
  return <GameScreen key={game.meta.id} game={game} input={{ config, items }} />
}
