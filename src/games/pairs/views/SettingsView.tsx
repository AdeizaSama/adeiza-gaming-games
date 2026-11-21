import { isOpen, type FreePlay, type SettingsViewProps } from '../../../sdk/game/settings'
import { Section } from '../../../ui/section'
import { Stepper } from '../../../ui/stepper'
import type { PairsConfig, PairsPlay } from '../config'

const plays: readonly { id: PairsPlay; name: string; description: string }[] = [
  { id: 'flip', name: 'Flip cards', description: 'See one side, think, flip, and say honestly if you knew it.' },
  { id: 'match', name: 'Match-up', description: 'Three words, ten tiles: find their three partners.' },
  { id: 'odd', name: 'Odd one out', description: "A group and ten words: find the three that don't belong." },
]

/** A choice of one, as cards with a radio button (as on Charades' setup). */
function Choice<Id extends string>({ name, choices, value, onChange }: { name: string; choices: readonly { id: Id; name: string; description: string }[]; value: Id | undefined; onChange: (id: Id) => void }) {
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

/**
 * Pairs' own settings on setup (ADR 0008, 0020): the way to play, both ways or one, and cards a turn. On a variant's
 * setup, only the open ones (ADR 0018).
 */
export function SettingsView({ settings, onChange, open }: SettingsViewProps<PairsConfig>) {
  return (
    <>
      {isOpen(open, 'play') && (
        <Section title="Way to play">
          <Choice name="pairs-play" choices={plays} value={settings.play} onChange={(play) => onChange({ play })} />
        </Section>
      )}
      {isOpen(open, 'twoWay') && (
        <Section title="Both ways" hint="Show either side first. Leave off for packs of words and their groups.">
          <label className="flex items-center gap-3 rounded-xl bg-card p-4 text-card-foreground shadow-sm">
            <input type="checkbox" className="size-5 shrink-0 accent-primary" checked={settings.twoWay} onChange={(event) => onChange({ twoWay: event.target.checked })} />
            <span className="font-semibold">Either side first</span>
          </label>
        </Section>
      )}
      {isOpen(open, 'cards') && (
        <Section title="Cards per turn" hint="Cards to flip, or sets of ten tiles.">
          <Stepper label="Cards per turn" value={settings.cards} min={1} max={50} onChange={(cards) => onChange({ cards })} />
        </Section>
      )}
    </>
  )
}

const lengths = [
  { id: '10', name: '10 cards', description: 'At your own pace: no clock.' },
  { id: '20', name: '20 cards', description: 'At your own pace: no clock.' },
  { id: '50', name: '50 cards', description: 'At your own pace: no clock.' },
] as const

/** Pairs' Free Play settings (ADR 0019): how many cards, or sets of tiles, at your own pace. */
export function FreePlayView({ settings, onChange }: SettingsViewProps<PairsConfig>) {
  return (
    <Section title="Length">
      <Choice
        name="pairs-length"
        choices={lengths}
        value={lengths.find((length) => length.id === String(settings.cards))?.id}
        onChange={(id) => onChange({ cards: Number(id) })}
      />
    </Section>
  )
}

/** What Pairs gives `defineGame` to offer Free Play: 10 cards, no clock, to start. */
export const pairsFreePlay: FreePlay<PairsConfig> = { view: FreePlayView, settings: { cards: 10, timer: false } }
