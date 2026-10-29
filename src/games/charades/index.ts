import { loadPacks } from '../../sdk/content/loadPacks'
import { TeamTurnsConfig } from '../../sdk/formats/team-turns/config'
import { defineGame } from '../../sdk/game/defineGame'
import { machine } from './machine'
import { itemKey, itemSchema } from './schema'

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
  // The format's settings for now. Charades' own (modes, skip penalty) and its presets come in chapter 06.
  config: { schema: TeamTurnsConfig },
  machine,
})
