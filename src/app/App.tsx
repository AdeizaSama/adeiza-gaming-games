import { GameScreen } from './play/GameScreen'
import { games } from './registry'
import { TeamTurnsConfig } from '../sdk/formats/team-turns/config'
import { choosePoolItems } from '../sdk/formats/team-turns/pool'

// A fixed demo game, until the library, setup screen and routing arrive (steps 10 to 12).
const charades = games[0]
const config = TeamTurnsConfig.parse({ teams: ['Lions', 'Eagles'], rounds: 1, seconds: 30, packs: ['back-to-school'] })
const items = choosePoolItems(charades.content.packs, config, charades.content.itemKey)

export default function App() {
  return <GameScreen game={charades} input={{ config, items }} />
}
