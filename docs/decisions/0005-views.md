# 0005. Views: how each phase is shown

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

Every phase of a game is shown by one view (standard §5): the handoff screen, the card during a turn, the turn summary, the results. Chapter 03 built the machines with no views; [ADR 0004](0004-team-turns-builder.md) recorded that views would be added to `defineGame` as a required field keyed by phase name. This record fixes how.

Constraints:

- **No phase without a view.** A phase with nothing to show would leave players on a blank screen. That should be a type error, not a bug found mid-game.
- **The format's phases are the same in every team-turns game.** Every game shouldn't have to rebuild the handoff screen.
- **Views send events; they never change the game directly** (standard §4).
- **Game logic stays deterministic.** Randomness and time reach the machine only through the runner.

## Decision

### Views live in `defineGame`, keyed by phase

```ts
defineGame({
  …,
  machine,
  views: { turn: TurnView, turn_summary: SummaryView },
})
```

- **Every one of the game's own phases needs a view.** For Charades that's `turn`. Leaving one out, or naming a phase the machine doesn't have, is a type error.
- **The format's phases have default views,** written once in `src/sdk/formats/team-turns/views/`: `handoff`, `turn_summary` and `results`. A game may replace any of them by listing it. Charades replaces `turn_summary`, to list the items that were got and skipped, which the format can't know how to show.
- `defineGame` fills in the defaults, so the defined game's `views` covers every phase. The app looks up `game.views[state.phase]` and never needs to know which views came from where.

### What a view receives

```ts
interface TeamTurnsViewProps<Item, Turn, Event, Config> {
  context: TeamTurnsContext<Item, Turn, Config>  // the game's data, to show
  send: (event: Event | TeamTurnsEvent) => void  // to report what the players did
  points: (turn: Turn) => number                 // the game's scoring, for the summary
}
```

- **`context`, not the whole state.** The phase is already known (it picked the view), and `rngState` is the runner's business.
- **`send`** takes an event. The app's session adds the current time (`Date.now()`) and passes it to the runner, so views never deal with `now` or the Rng.
- **`points`** lets the default summary say "Lions scored 3" for any game. `teamTurns` keeps the game's `points` on the machine it returns (`machine.points`), and the app passes it through.
- The props belong to the format (`TeamTurnsViewProps`). A future host-led format will have its own.

Views may read the clock to **display** time (the countdown). They never decide anything with it: running out of time is reported by sending `time_up`, and the machine decides what that means.

### `send` accepts every event the game has, not only the current phase's

The ideal would be a `send` that only accepts the events the view's own phase handles. That needs each phase's exact event list as a type, but `teamTurns` declares its return type (ADR 0004), which keeps phase names and leaves out which events each phase handles. Keeping them would make the builder's types much harder to read for one extra check.

So a view's `send` accepts any of the game's events. Sending one the current phase doesn't handle is harmless: the runner ignores it (ADR 0002). A typo is still a type error (`send({ type: 'jump' })`), and the full click-through tests catch a view sending the wrong event.

### Where things live

| What | Where |
|---|---|
| Interaction primitives (Handoff, Countdown, FlashCard, Summary, Leaderboard) | `src/sdk/interactions/` |
| The format's default views | `src/sdk/formats/team-turns/views/` |
| A game's views | `src/games/<id>/views/` |

Views are built from primitives (standard §6). A primitive knows nothing about machines: it takes plain props (a title, an item, callbacks). A view connects a primitive to the game: it reads `context` and calls `send`.

### Mistakes that are type errors

Checked with a prototype before this record was written:

- A game phase without a view.
- A view for a phase the machine doesn't have.
- A view that sends an event the game doesn't have.
- A view written for a different item type than the game's.

### Rejected

- *Every view written by each game, format phases included.* Three identical handoff screens across Charades, Name Ten and Trivia, and each copy drifting on its own.
- *The format's views always used, with no override.* Charades couldn't show which items were got, because the format's summary doesn't know what a Charades turn record holds.
- *Choosing the view from `interaction`* (e.g. every phase with `interaction: 'summary'` gets the Summary primitive). A primitive alone can't know what to show: it needs a view to read the game's context. `interaction` stays as a description of the phase.

## Consequences

- A team-turns game writes a view for its turn (and anything it adds, like Trivia's `steal`), and gets a working handoff, summary and results for free.
- The app's play screen is one line of logic: render `game.views[state.phase]`.
- `teamTurns`' machine gains a `points` field. It's ignored by the runner.
- Standard §3, §6 and §7 describe views as built.
- Per-phase typing of `send` can be added later if the builder keeps each phase's events; that change would need its own record.
