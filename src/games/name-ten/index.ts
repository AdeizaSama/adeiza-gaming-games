import { loadPacks } from '../../sdk/content/loadPacks'
import { defineGame } from '../../sdk/game/defineGame'
import { NameTenConfig } from './config'
import { machine } from './machine'
import rules from './rules.md?raw'
import { itemKey, itemSchema } from './schema'
import { HandoffView } from './views/HandoffView'
import { ReviewView } from './views/ReviewView'
import { SettingsView } from './views/SettingsView'
import { TurnView } from './views/TurnView'

export default defineGame({
  meta: {
    id: 'name-ten',
    name: 'Name Ten',
    tagline: 'Name ten before the clock runs out.',
    icon: 'list-checks',
    format: 'team-turns',
    players: { min: 2, max: 20 },
    complexity: 1,
    tags: ['party', 'trivia'],
    contributors: ['AdeizaSama'],
  },
  content: {
    itemSchema,
    itemKey,
    packs: loadPacks(import.meta.glob('./content/*.json', { eager: true, import: 'default' }), itemSchema, itemKey),
  },
  // The format's settings plus how many answers go on the board (ADR 0012), shown on setup by SettingsView.
  config: {
    schema: NameTenConfig,
    view: SettingsView,
    presets: [
      { id: 'quick', name: 'Quick', contributors: ['AdeizaSama'], config: { rounds: 2, seconds: 45 } },
      { id: 'classic', name: 'Classic', contributors: ['AdeizaSama'], config: {} }, // the defaults: 3 rounds, 60 s, 10 answers
    ],
  },
  rules,
  machine,
  // The handoff is Name Ten's own: the phone goes to a judge, not to the team playing (ADR 0012).
  views: { handoff: HandoffView, turn: TurnView, review: ReviewView },
})
