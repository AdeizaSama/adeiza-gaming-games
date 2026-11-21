import { Section } from '../../../../ui/section'
import { Stepper } from '../../../../ui/stepper'
import type { FreePlay, SettingsViewProps } from '../../../game/settings'
import type { ChoiceConfig } from './config'
import { Choice } from './SettingsView'

/** The lengths a Free Play game can be (ADR 0019): a set number of questions with no clock, or against the clock. */
const lengths = [
  { id: '10', name: '10 questions', description: 'At your own pace: no clock.' },
  { id: '20', name: '20 questions', description: 'At your own pace: no clock.' },
  { id: '50', name: '50 questions', description: 'At your own pace: no clock.' },
  { id: 'clock', name: 'Against the clock', description: 'As many as you can before time runs out.' },
] as const

type Length = (typeof lengths)[number]['id']

/** Which length the settings are: against the clock, or the number of questions (none picked for another number). */
export function lengthOf(settings: Pick<ChoiceConfig, 'mode' | 'questions'>): Length | undefined {
  if (settings.mode === 'clock') return 'clock'
  return lengths.find((length) => length.id === String(settings.questions))?.id
}

/** The settings for a length: a number of questions with no clock, or against the clock with one. */
export function lengthSettings(length: Length): Partial<ChoiceConfig> {
  return length === 'clock' ? { mode: 'clock', timer: true } : { mode: 'questions', questions: Number(length), timer: false }
}

/**
 * A multiple-choice game's Free Play settings on setup (ADR 0019): how long the game is, and how long the clock runs
 * against the clock. The rest is the variant's.
 */
export function ChoiceFreePlayView({ settings, onChange }: SettingsViewProps<ChoiceConfig>) {
  const length = lengthOf(settings)
  return (
    <Section title="Length">
      <Choice name="free-play-length" choices={lengths} value={length ?? ('' as Length)} onChange={(id) => onChange(lengthSettings(id))} />
      {length === 'clock' && (
        <Stepper
          label="Time"
          value={settings.seconds}
          min={30}
          max={300}
          step={15}
          format={(value) => `${value} seconds`}
          onChange={(seconds) => onChange({ seconds })}
        />
      )}
    </Section>
  )
}

/**
 * What a multiple-choice game gives `defineGame` to offer Free Play (ADR 0019): the view, and where Free Play starts
 * (10 questions, no clock), on top of the variant's own settings.
 */
export const choiceFreePlay: FreePlay<ChoiceConfig> = {
  view: ChoiceFreePlayView,
  settings: { mode: 'questions', questions: 10, timer: false },
}
