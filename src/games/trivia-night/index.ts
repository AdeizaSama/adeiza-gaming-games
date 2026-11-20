import { loadPacks } from '../../sdk/content/loadPacks'
import { loadVariants } from '../../sdk/content/variant'
import { defineGame } from '../../sdk/game/defineGame'
import { TriviaConfig } from './config'
import { machine } from './machine'
import rules from './rules.md?raw'
import { itemKey, itemSchema } from './schema'
import { ChoiceSettingsView } from '../../sdk/formats/team-turns/choice/SettingsView'
import { choiceTurnView } from '../../sdk/formats/team-turns/choice/TurnView'
import type { TriviaItem } from './schema'

/** The question and its result share one view (ADR 0017). */
export const TurnView = choiceTurnView<TriviaItem>()

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
    view: ChoiceSettingsView,
  },
  rules,
  // The ways to play it on the home page (ADR 0018), one JSON file each.
  variants: loadVariants(import.meta.glob('./variants/*.json', { eager: true, import: 'default' })),
  machine,
  // The choice turn's view (ADR 0017), for the question and its result. The format's handoff gives the phone to the team playing: nothing on screen gives the answer away before a pick.
  views: { turn: TurnView, reveal: TurnView },
})
