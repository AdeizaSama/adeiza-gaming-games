import { loadPacks } from '../../sdk/content/loadPacks'
import { defineGame } from '../../sdk/game/defineGame'
import { CharadesConfig } from './config'
import { machine } from './machine'
import { itemKey, itemSchema } from './schema'
import { ReviewView } from './views/ReviewView'
import { SettingsView } from './views/SettingsView'
import { TurnView } from './views/TurnView'

export default defineGame({
  meta: {
    id: 'charades',
    name: 'Charades',
    tagline: 'Act it out. Beat the clock.',
    icon: 'drama',
    format: 'team-turns',
    players: { min: 2, max: 20 },
    complexity: 1,
    tags: ['party', 'acting'],
    contributors: ['AdeizaSama'],
  },
  content: {
    itemSchema,
    itemKey,
    packs: loadPacks(import.meta.glob('./content/*.json', { eager: true, import: 'default' }), itemSchema, itemKey),
  },
  // The format's settings plus mode and points (ADR 0007), shown on setup by SettingsView (ADR 0008).
  config: { schema: CharadesConfig, view: SettingsView },
  machine,
  // handoff, turn_summary and results use the format's views. Review lists the cards, so the summary needn't.
  views: { turn: TurnView, review: ReviewView },
})
