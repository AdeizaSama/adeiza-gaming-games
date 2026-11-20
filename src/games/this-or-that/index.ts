import { loadPacks } from '../../sdk/content/loadPacks'
import { ChoiceSettingsView } from '../../sdk/formats/team-turns/choice/SettingsView'
import { choiceTurnView } from '../../sdk/formats/team-turns/choice/TurnView'
import { defineGame } from '../../sdk/game/defineGame'
import { ThisOrThatConfig } from './config'
import { machine } from './machine'
import rules from './rules.md?raw'
import { itemKey, itemSchema, type ThisOrThatItem } from './schema'

/** The question and its result share one view (ADR 0017). */
export const TurnView = choiceTurnView<ThisOrThatItem>('This or that?')

export default defineGame({
  meta: {
    id: 'this-or-that',
    name: 'This or That',
    tagline: 'One or the other, as fast as you can.',
    icon: 'arrow-left-right',
    format: 'team-turns',
    players: { min: 2, max: 20 },
    complexity: 1,
    tags: ['party', 'quiz', 'language'],
    contributors: ['AdeizaSama'],
  },
  content: {
    itemSchema,
    itemKey,
    packs: loadPacks(import.meta.glob('./content/*.json', { eager: true, import: 'default' }), itemSchema, itemKey),
  },
  // The choice turn's settings, with This or That's defaults (ADR 0017), shown by the choice turn's settings view.
  config: {
    schema: ThisOrThatConfig,
    view: ChoiceSettingsView,
  },
  rules,
  machine,
  // The format's handoff gives the phone to the team playing: nothing on screen gives the answer away before a pick.
  views: { turn: TurnView, reveal: TurnView },
})
