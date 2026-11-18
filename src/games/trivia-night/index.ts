import { loadPacks } from '../../sdk/content/loadPacks'
import { defineGame } from '../../sdk/game/defineGame'
import { TriviaConfig } from './config'
import { machine } from './machine'
import rules from './rules.md?raw'
import { itemKey, itemSchema } from './schema'
import { SettingsView } from './views/SettingsView'
import { TurnView } from './views/TurnView'

export default defineGame({
  meta: {
    id: 'trivia-night',
    name: 'Trivia Night',
    tagline: 'Pick the right answer before the clock runs out.',
    icon: 'lightbulb',
    format: 'team-turns',
    players: { min: 2, max: 20 },
    complexity: 1,
    tags: ['party', 'trivia', 'quiz'],
    contributors: ['AdeizaSama'],
  },
  content: {
    itemSchema,
    itemKey,
    packs: loadPacks(import.meta.glob('./content/*.json', { eager: true, import: 'default' }), itemSchema, itemKey),
  },
  // The format's settings plus the mode, questions a turn, points and option order (ADR 0015), shown by SettingsView.
  config: {
    schema: TriviaConfig,
    view: SettingsView,
    presets: [
      { id: 'one-question', name: 'One question', contributors: ['AdeizaSama'], config: {} }, // the defaults: 3 rounds, 30 s
      { id: 'five-questions', name: 'Five questions', contributors: ['AdeizaSama'], config: { questions: 5, seconds: 120 } },
      { id: 'against-the-clock', name: 'Against the clock', contributors: ['AdeizaSama'], config: { mode: 'clock', seconds: 60 } },
    ],
  },
  rules,
  machine,
  // The format's handoff gives the phone to the team playing: nothing on screen gives the answer away before a pick.
  views: { turn: TurnView, reveal: TurnView },
})
