import { isOpen, type SettingsViewProps } from '../../../sdk/game/settings'
import { Section } from '../../../ui/section'
import { Stepper } from '../../../ui/stepper'
import type { NameTenConfig } from '../config'

/** Name Ten's own setting on setup (ADR 0008): how many answers go on the judge's board. */
export function SettingsView({ settings, onChange, open }: SettingsViewProps<NameTenConfig>) {
  // On a variant's setup, only if it's open (ADR 0018).
  if (!isOpen(open, 'shown')) return null
  return (
    <Section title="Answers on the board" hint="Up to this many of each category's answers. A category with fewer shows all of its own.">
      <Stepper label="Answers on the board" value={settings.shown} min={10} max={15} onChange={(shown) => onChange({ shown })} />
    </Section>
  )
}
