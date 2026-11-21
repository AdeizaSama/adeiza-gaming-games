import { loadPacks } from '../../sdk/content/loadPacks'
import { loadVariants } from '../../sdk/content/variant'
import { defineGame } from '../../sdk/game/defineGame'
import { PairsConfig } from './config'
import { machine } from './machine'
import rules from './rules.md?raw'
import { itemKey, itemSchema } from './schema'
import { pairsFreePlay, SettingsView } from './views/SettingsView'
import { TurnView } from './views/TurnView'

export default defineGame({
  meta: {
    id: 'pairs',
    name: 'Pairs',
    tagline: 'Learn words in pairs: flip cards, match them up, or find the odd ones out.',
    icon: 'layers',
    format: 'team-turns',
    players: { min: 2, max: 20 },
    complexity: 1,
    tags: ['learning', 'language'],
    contributors: ['AdeizaSama'],
  },
  content: {
    itemSchema,
    itemKey,
    packs: loadPacks(import.meta.glob('./content/*.json', { eager: true, import: 'default' }), itemSchema, itemKey),
  },
  // The format's settings plus the way to play, both ways, and cards a turn (ADR 0020); Free Play too (ADR 0019).
  config: {
    schema: PairsConfig,
    view: SettingsView,
    freePlay: pairsFreePlay,
  },
  rules,
  // The ways to play it on the home page (ADR 0018), one JSON file each.
  variants: loadVariants(import.meta.glob('./variants/*.json', { eager: true, import: 'default' })),
  machine,
  // One view for the card or tiles and their answer. The format's handoff gives the phone to the team playing.
  views: { turn: TurnView, reveal: TurnView },
})
