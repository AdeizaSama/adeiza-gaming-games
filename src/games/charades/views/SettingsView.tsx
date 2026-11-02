import { useState } from 'react'
import type { SettingsViewProps } from '../../../sdk/game/settings'
import { Button } from '../../../ui/button'
import { Dialog } from '../../../ui/dialog'
import { Section } from '../../../ui/section'
import { Stepper } from '../../../ui/stepper'
import { CharadesConfig } from '../config'

type Points = CharadesConfig['points']

/** The points players get when they never open Advanced settings (2, 3, 3, and 1 for a skip). */
const defaultPoints: Points = CharadesConfig.shape.points.parse(undefined)

const modes = [
  { id: 'describe', name: 'Describe', description: 'Say anything but the word on the card.' },
  { id: 'mix', name: 'Mix it up', description: 'Each card says how to clue it: describe it, act it out, or sing or hum it.' },
] as const

/** "1 point", "3 points". */
export const pointsLabel = (points: number) => `${points} ${points === 1 ? 'point' : 'points'}`

/** What a skip costs: "No penalty", or "−1 point". */
export const skipLabel = (points: number) => (points === 0 ? 'No penalty' : `−${pointsLabel(points)}`)

/** The points in one line, under the Advanced settings button. */
export const pointsSummary = ({ describe, act, sing, skip }: Points) =>
  `Describe ${describe} · Act ${act} · Sing ${sing} · Skip ${skip === 0 ? '0' : `−${skip}`}`

const samePoints = (a: Points, b: Points) => a.describe === b.describe && a.act === b.act && a.sing === b.sing && a.skip === b.skip

/** Charades' own settings on setup (ADR 0008): the mode, and points per result in Advanced settings. */
export function SettingsView({ settings, onChange }: SettingsViewProps<CharadesConfig>) {
  const [advanced, setAdvanced] = useState(false)
  const { points } = settings
  const setPoints = (changes: Partial<Points>) => onChange({ points: { ...points, ...changes } })

  return (
    <>
      <Section title="Mode">
        {modes.map((mode) => (
          <label key={mode.id} className="flex items-start gap-3 rounded-xl bg-card p-4 text-card-foreground shadow-sm">
            <input
              type="radio"
              name="charades-mode"
              className="mt-1 size-5 shrink-0 accent-primary"
              checked={settings.mode === mode.id}
              onChange={() => onChange({ mode: mode.id })}
            />
            <span className="flex flex-col gap-1">
              <span className="font-semibold">{mode.name}</span>
              <span className="text-sm text-muted-foreground">{mode.description}</span>
            </span>
          </label>
        ))}
        <Button variant="outline" onClick={() => setAdvanced(true)}>
          Advanced settings
        </Button>
        <p className="text-center text-sm text-muted-foreground">{pointsSummary(points)}</p>
      </Section>

      <Dialog
        open={advanced}
        onClose={() => setAdvanced(false)}
        title="Advanced settings"
        description="Points for each card. A turn never scores below 0."
      >
        <PointsStepper label="Described" value={points.describe} onChange={(describe) => setPoints({ describe })} />
        <PointsStepper label="Acted" value={points.act} onChange={(act) => setPoints({ act })} />
        <PointsStepper label="Sung or hummed" value={points.sing} onChange={(sing) => setPoints({ sing })} />
        {settings.mode === 'describe' && <p className="text-sm text-muted-foreground">Acted and sung cards only come up in Mix it up.</p>}
        <PointsStepper label="Skipped" min={0} format={skipLabel} value={points.skip} onChange={(skip) => setPoints({ skip })} />
        <Button variant="ghost" disabled={samePoints(points, defaultPoints)} onClick={() => onChange({ points: defaultPoints })}>
          Reset to defaults
        </Button>
        <Button onClick={() => setAdvanced(false)}>Done</Button>
      </Dialog>
    </>
  )
}

/** One result's points: a label above a stepper, 1–5 (0–5 for a skip), as the schema allows. */
function PointsStepper({ label, min = 1, format = pointsLabel, value, onChange }: { label: string; min?: number; format?: (value: number) => string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-semibold">{label}</p>
      <Stepper label={label} value={value} min={min} max={5} format={format} onChange={onChange} />
    </div>
  )
}
