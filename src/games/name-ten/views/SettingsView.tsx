import type { SettingsViewProps } from '../../../sdk/game/settings'
import { Section } from '../../../ui/section'
import { Stepper } from '../../../ui/stepper'
import type { NameTenConfig } from '../config'

/** Name Ten's own setting on setup (ADR 0008): how many answers go on the judge's board. */
export function SettingsView({ settings, onChange }: SettingsViewProps<NameTenConfig>) {
  return (
    <Section title="Answers on the board" hint="Up to this many of each category's answers. A category with fewer shows all of its own.">
      <Stepper label="Answers on the board" value={settings.shown} min={10} max={15} onChange={(shown) => onChange({ shown })} />
    </Section>
  )
}
