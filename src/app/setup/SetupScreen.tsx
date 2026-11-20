import { BookOpen, ChevronLeft, X } from 'lucide-react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { Variant } from '../../sdk/content/variant'
import type { TeamTurnsConfig } from '../../sdk/formats/team-turns/config'
import { choosePoolItems } from '../../sdk/formats/team-turns/pool'
import type { Game } from '../../sdk/game/defineGame'
import type { MachineEvent } from '../../sdk/machine/types'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Section } from '../../ui/section'
import { Stepper } from '../../ui/stepper'
import { isOpen } from '../../sdk/game/settings'
import { defaultSetup, loadSetup, loadVariantSetup, saveSetup, variantSetupId, type SetupChoices } from './savedSetup'
import { loadTeams, saveTeams } from './savedTeams'

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
  /**
   * The variant being set up (ADR 0018): its name and tagline, its packs and tags, and only its open settings. Leave
   * out for the game's own setup, with every setting.
   */
  variant?: Variant
  /** Called with checked settings when players tap Start. */
  onStart: (config: Config) => void
}

/**
 * Settings for any team-turns game: teams, rounds, turn length, packs and tags (standard §7).
 * The game's config schema checks them as players go; its messages are shown next to the field they're about.
 *
 * For a variant (ADR 0018), the variant's settings and content, with only teams and its open settings shown.
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
>({ game, variant, onStart }: SetupScreenProps<Item, Config, Setup, Turn, Event, Phase, GuardName, ActionName>) {
  const { packs, itemKey } = game.content
  const SettingsView = game.config.view
  // Every setting but the teams, as one draft (ADR 0008): what players chose last time on this device, or the
  // game's defaults, read from its schema so this screen can't disagree with it. A variant's starts from its own.
  const [choices, setChoices] = useState(() => (variant ? loadVariantSetup(game, variant) : (loadSetup(game) ?? defaultSetup(game))))
  const setupId = variant ? variantSetupId(game.meta.id, variant) : game.meta.id
  /** On a variant, only its open settings are shown; on the game's own setup, all of them. */
  const shown = (name: string) => isOpen(variant?.open, name)
  const [teams, setTeams] = useState(() => loadTeams() ?? ['Team 1', 'Team 2'])
  const { rounds, seconds, packs: chosenPacks, tags: chosenTags } = choices
  // The format's own settings. A spread keeps the game's fields as they are, so TypeScript accepts it for any game.
  const change = (changes: Partial<SetupChoices<TeamTurnsConfig>>) => setChoices((current) => ({ ...current, ...changes }))
  const id = useId()

  // Remember every change as it's made, so a back swipe or a refresh in the middle of setup loses nothing.
  useEffect(() => {
    saveTeams(teams)
    saveSetup(setupId, choices)
  }, [setupId, teams, choices])

  // Only the chosen packs' tags are offered. A tag picked before its pack was unticked stops counting.
  const tags = [...new Set(packs.filter((pack) => chosenPacks.includes(pack.id)).flatMap((pack) => pack.items.flatMap((item) => item.tags ?? [])))].sort()
  const activeTags = chosenTags.filter((tag) => tags.includes(tag))

  const settings = game.config.schema.safeParse({ ...choices, teams, tags: activeTags })
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
        <h1 className="text-4xl font-bold">{variant?.name ?? game.meta.name}</h1>
        <p className="text-lg text-muted-foreground">{variant?.tagline ?? game.meta.tagline}</p>
        <Link to={`/${game.meta.id}/rules`} state={{ fromSetup: true }} className="flex min-h-11 items-center gap-2 self-start font-semibold text-primary">
          <BookOpen aria-hidden className="size-5" />
          How to play
        </Link>
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

      {shown('rounds') && (
        <Section title="Rounds" hint="Every team plays once per round.">
          <Stepper label="Rounds" value={rounds} min={1} max={10} onChange={(value) => change({ rounds: value })} />
        </Section>
      )}

      {shown('seconds') && (
        <Section title="Turn length">
          <Stepper
            label="Turn length"
            value={seconds}
            min={15}
            max={300}
            step={15}
            format={(value) => `${value} seconds`}
            onChange={(value) => change({ seconds: value })}
          />
        </Section>
      )}

      {SettingsView && (
        <SettingsView settings={choices} open={variant?.open} onChange={(changes) => setChoices((current) => ({ ...current, ...changes }))} />
      )}

      {/* A variant's content is the variant: its packs and tags aren't for players to change. */}
      {!variant && (
        <Section title="Packs">
          {packs.map((pack) => (
            <label key={pack.id} className="flex items-start gap-3 rounded-xl bg-card p-4 text-card-foreground shadow-sm">
              <input
                type="checkbox"
                className="mt-1 size-5 shrink-0 accent-primary"
                checked={chosenPacks.includes(pack.id)}
                onChange={() => change({ packs: toggle(chosenPacks, pack.id) })}
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
      )}

      {!variant && tags.length > 0 && (
        <Section title="Only play" hint="Pick kinds of item to play only those. Pick none to play everything.">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const on = activeTags.includes(tag)
              return (
                <Button key={tag} variant={on ? 'primary' : 'outline'} aria-pressed={on} onClick={() => change({ tags: toggle(chosenTags, tag) })}>
                  {tag}
                </Button>
              )
            })}
          </div>
        </Section>
      )}

      {/*
        No background: the space around Start is only spacing, and the page (with its theme pattern) shows through.
        Only the item count has a backdrop, so it stays readable over cards scrolling under it.
      */}
      <div data-bar className="sticky bottom-0 mt-auto flex flex-col gap-2 py-4">
        {chosenPacks.length > 0 && (
          <p className="self-center rounded-full bg-background/75 px-3 py-1 text-center text-muted-foreground backdrop-blur-sm" aria-live="polite">
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

function ErrorText({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="text-sm font-medium text-destructive">
      {children}
    </p>
  )
}
