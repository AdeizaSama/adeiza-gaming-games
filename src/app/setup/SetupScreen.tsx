import { ChevronLeft, X } from 'lucide-react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { TeamTurnsConfig } from '../../sdk/formats/team-turns/config'
import { choosePoolItems } from '../../sdk/formats/team-turns/pool'
import type { Game } from '../../sdk/game/defineGame'
import type { MachineEvent } from '../../sdk/machine/types'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { loadSetup, saveSetup } from './savedSetup'
import { loadTeams, saveTeams } from './savedTeams'
import { Stepper } from './Stepper'

/** The format's own defaults (3 rounds, 60 seconds), read from its schema so this screen can't disagree with it. */
const defaults = TeamTurnsConfig.parse({ teams: ['Team 1', 'Team 2'], packs: ['any'] })

/** The limits the schema allows (standard §7). */
const maxTeams = 10
const minTeams = 2

/** "Team 3", or the next number not already taken. */
function nextTeamName(teams: readonly string[]): string {
  let number = teams.length + 1
  while (teams.includes(`Team ${number}`)) number++
  return `Team ${number}`
}

export interface SetupScreenProps<
  Item extends { tags?: readonly string[] },
  Config extends TeamTurnsConfig,
  Setup,
  Turn,
  Event extends MachineEvent,
  Phase extends string,
  GuardName extends string,
  ActionName extends string,
> {
  game: Game<Item, Config, Setup, Turn, Event, Phase, GuardName, ActionName>
  /** Called with checked settings when players tap Start. */
  onStart: (config: Config) => void
}

/**
 * Settings for any team-turns game: teams, rounds, turn length, packs and tags (standard §7).
 * The game's config schema checks them as players go; its messages are shown next to the field they're about.
 */
export function SetupScreen<
  Item extends { tags?: readonly string[] },
  Config extends TeamTurnsConfig,
  Setup,
  Turn,
  Event extends MachineEvent,
  Phase extends string,
  GuardName extends string,
  ActionName extends string,
>({ game, onStart }: SetupScreenProps<Item, Config, Setup, Turn, Event, Phase, GuardName, ActionName>) {
  const { packs, itemKey } = game.content
  // What players chose last time, on this device; the defaults otherwise.
  const [saved] = useState(() => loadSetup(game))
  const [teams, setTeams] = useState(() => loadTeams() ?? defaults.teams)
  const [rounds, setRounds] = useState(saved?.rounds ?? defaults.rounds)
  const [seconds, setSeconds] = useState(saved?.seconds ?? defaults.seconds)
  const [chosenPacks, setChosenPacks] = useState(() => saved?.packs ?? packs.map((pack) => pack.id))
  const [chosenTags, setChosenTags] = useState<string[]>(saved?.tags ?? [])
  const id = useId()

  // Remember every change as it's made, so a back swipe or a refresh in the middle of setup loses nothing.
  useEffect(() => {
    saveTeams(teams)
    saveSetup(game.meta.id, { rounds, seconds, packs: chosenPacks, tags: chosenTags })
  }, [game.meta.id, teams, rounds, seconds, chosenPacks, chosenTags])

  // Only the chosen packs' tags are offered. A tag picked before its pack was unticked stops counting.
  const tags = [...new Set(packs.filter((pack) => chosenPacks.includes(pack.id)).flatMap((pack) => pack.items.flatMap((item) => item.tags ?? [])))].sort()
  const activeTags = chosenTags.filter((tag) => tags.includes(tag))

  const settings = game.config.schema.safeParse({ teams, rounds, seconds, packs: chosenPacks, tags: activeTags })
  const items = choosePoolItems(packs, { packs: chosenPacks, tags: activeTags }, itemKey)

  /** The schema's message for exactly this field, e.g. `('teams', 1)` for the second team's name. */
  const problem = (...path: (string | number)[]) =>
    settings.error?.issues.find((issue) => issue.path.length === path.length && path.every((part, n) => issue.path[n] === part))?.message

  const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <Link to="/" className="flex items-center gap-1 self-start text-muted-foreground">
          <ChevronLeft aria-hidden className="size-5" />
          Games
        </Link>
        <h1 className="text-4xl font-bold">{game.meta.name}</h1>
        <p className="text-lg text-muted-foreground">{game.meta.tagline}</p>
      </header>

      <Section title="Teams" hint="In playing order.">
        {teams.map((team, index) => {
          const error = problem('teams', index)
          return (
            <div key={index} className="flex flex-col gap-1">
              <div className="flex gap-2">
                <Input
                  aria-label={`Team ${index + 1}`}
                  value={team}
                  maxLength={30}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${id}-team-${index}` : undefined}
                  onChange={(event) => setTeams(teams.map((t, i) => (i === index ? event.target.value : t)))}
                />
                {teams.length > minTeams && (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ${team.trim() || `team ${index + 1}`}`}
                    onClick={() => setTeams(teams.filter((_, i) => i !== index))}
                  >
                    <X aria-hidden />
                  </Button>
                )}
              </div>
              {error && <ErrorText id={`${id}-team-${index}`}>{error}</ErrorText>}
            </div>
          )
        })}
        {teams.length < maxTeams && (
          <Button variant="outline" onClick={() => setTeams([...teams, nextTeamName(teams)])}>
            Add team
          </Button>
        )}
      </Section>

      <Section title="Rounds" hint="Every team plays once per round.">
        <Stepper label="Rounds" value={rounds} min={1} max={10} onChange={setRounds} />
      </Section>

      <Section title="Turn length">
        <Stepper
          label="Turn length"
          value={seconds}
          min={15}
          max={300}
          step={15}
          format={(value) => `${value} seconds`}
          onChange={setSeconds}
        />
      </Section>

      <Section title="Packs">
        {packs.map((pack) => (
          <label key={pack.id} className="flex items-start gap-3 rounded-xl bg-card p-4 text-card-foreground shadow-sm">
            <input
              type="checkbox"
              className="mt-1 size-5 shrink-0 accent-primary"
              checked={chosenPacks.includes(pack.id)}
              onChange={() => setChosenPacks(toggle(chosenPacks, pack.id))}
            />
            <span className="flex flex-col gap-1">
              <span className="font-semibold">
                {pack.name} <span className="font-normal text-muted-foreground">· {pack.items.length} items</span>
              </span>
              <span className="text-sm text-muted-foreground">{pack.description}</span>
            </span>
          </label>
        ))}
        {problem('packs') && <ErrorText>{problem('packs')}</ErrorText>}
      </Section>

      {tags.length > 0 && (
        <Section title="Only play" hint="Pick kinds of item to play only those. Pick none to play everything.">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const on = activeTags.includes(tag)
              return (
                <Button key={tag} variant={on ? 'primary' : 'outline'} aria-pressed={on} onClick={() => setChosenTags(toggle(chosenTags, tag))}>
                  {tag}
                </Button>
              )
            })}
          </div>
        </Section>
      )}

      <div className="sticky bottom-0 mt-auto flex flex-col gap-2 bg-background py-4">
        {chosenPacks.length > 0 && (
          <p className="text-center text-muted-foreground" aria-live="polite">
            {items.length === 0
              ? 'No items match. Pick another pack or kind.'
              : `${items.length} ${items.length === 1 ? 'item' : 'items'} to play`}
          </p>
        )}
        <Button
          size="lg"
          className="w-full"
          disabled={!settings.success || items.length === 0}
          onClick={() => settings.success && onStart(settings.data)}
        >
          Start
        </Button>
      </div>
    </main>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function ErrorText({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="text-sm font-medium text-destructive">
      {children}
    </p>
  )
}
