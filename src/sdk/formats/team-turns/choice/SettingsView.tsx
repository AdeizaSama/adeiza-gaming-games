import { Section } from '../../../../ui/section'
import { Stepper } from '../../../../ui/stepper'
import { isOpen, type SettingsViewProps } from '../../../game/settings'
import type { ChoiceConfig } from './config'

const modes = [
  { id: 'questions', name: 'Set questions', description: 'Each turn is a set number of questions. The turn ends when they’re answered, or time runs out.' },
  { id: 'clock', name: 'Against the clock', description: 'Answer as many as you can before time runs out.' },
] as const

const orders = [
  { id: 'shuffle', name: 'Shuffled', description: 'A new order every time.' },
  { id: 'alphabetical', name: 'A to Z', description: 'Always the same order: numbers smallest first.' },
] as const

/** A choice of one, as cards with a radio button (as on Charades' setup). */
function Choice<Id extends string>({ name, choices, value, onChange }: { name: string; choices: readonly { id: Id; name: string; description: string }[]; value: Id; onChange: (id: Id) => void }) {
  return choices.map((choice) => (
    <label key={choice.id} className="flex items-start gap-3 rounded-xl bg-card p-4 text-card-foreground shadow-sm">
      <input type="radio" name={name} className="mt-1 size-5 shrink-0 accent-primary" checked={value === choice.id} onChange={() => onChange(choice.id)} />
      <span className="flex flex-col gap-1">
        <span className="font-semibold">{choice.name}</span>
        <span className="text-sm text-muted-foreground">{choice.description}</span>
      </span>
    </label>
  ))
}

/** "1 point", "3 points". */
export const pointsLabel = (points: number) => `${points} ${points === 1 ? 'point' : 'points'}`

/**
 * A multiple-choice game's settings on setup (ADR 0008, 0015, 0017): how a turn plays, points, option order. On a
 * variant's setup, only the open ones (ADR 0018). Questions per turn only means something in Set questions mode.
 */
export function ChoiceSettingsView({ settings, onChange, open }: SettingsViewProps<ChoiceConfig>) {
  const questions = isOpen(open, 'questions') && settings.mode === 'questions' && (
    <Stepper label="Questions per turn" value={settings.questions} min={1} max={10} onChange={(questions) => onChange({ questions })} />
  )
  return (
    <>
      {isOpen(open, 'mode') ? (
        <Section title="Mode">
          <Choice name="choice-mode" choices={modes} value={settings.mode} onChange={(mode) => onChange({ mode })} />
          {questions}
        </Section>
      ) : (
        questions && <Section title="Questions per turn">{questions}</Section>
      )}
      {isOpen(open, 'points') && (
        <Section title="Points for a right answer" hint="A wrong answer costs nothing.">
          <Stepper label="Points for a right answer" value={settings.points} min={1} max={5} format={pointsLabel} onChange={(points) => onChange({ points })} />
        </Section>
      )}
      {isOpen(open, 'order') && (
        <Section title="Order of the options">
          <Choice name="choice-order" choices={orders} value={settings.order} onChange={(order) => onChange({ order })} />
        </Section>
      )}
    </>
  )
}
