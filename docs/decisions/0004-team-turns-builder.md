# 0004. How a game plugs its turn into the team-turns format

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

The team-turns format (standard §7) is the outer loop shared by Charades, Name Ten and Trivia Night: pass the phone to a team, play a timed turn, show what happened, move on to the next team, and show the results after the last round. Only the inside of a turn differs between games:

```
handoff ──start──▶ [ the game's turn ] ──▶ turn_summary ──next──▶ handoff (next team)
                                                       └──next──▶ results (after the last turn)
```

The standard says a game may **add** phases (Trivia's `steal`) but must not **change** the format's loop. Something has to combine the format's phases, guards and actions with each game's into one machine that the runner (ADR 0002) can play.

Three things constrain the design:

- **Typos must be reported where they are.** ADR 0002's Consequences warn that copying one machine's `phases` into another with `...` lets TypeScript infer names from both, so a mistake can be reported in the wrong place.
- **The loop can't be changed by accident.** A game that overwrites `handoff` or jumps straight to `results` breaks the format for everyone who expects it.
- **The runner stays as it is.** It's about 60 lines, and it's the one piece every game depends on.

We considered three designs.

**(a) The game copies the format's parts into its own `defineMachine` call:**

```ts
defineMachine<…>()({
  phases:  { ...teamTurnsPhases, turn: { … } },
  guards:  { ...teamTurnsGuards,  … },
  actions: { ...teamTurnsActions, … },
})
```

**(b) The format provides a builder function.** The game passes in only its turn, and the function returns the whole machine.

**(c) The turn is its own machine,** run by the format's machine while it's in its `turn` phase.

## Decision

**(b): the format exports `teamTurns`, a builder function.** A game writes only its turn:

```ts
export const machine = teamTurns<CharadesItem, CharadesTurn, CharadesEvent>()({
  newTurn: () => ({ got: [], skipped: [] }),        // the game's record of one turn, fresh each turn
  points: (turn) => turn.got.length,                // what this turn scores
  phases: {
    turn: {
      interaction: 'flash_card',
      on: {
        got:     { actions: ['markGot', 'drawItem'] },
        skip:    { actions: ['markSkipped', 'drawItem'] },
        time_up: { to: 'turn_summary' },
      },
    },
  },
  guards:  {},
  actions: { markGot: …, markSkipped: … },
})
```

`teamTurns` adds the format's phases (`handoff`, `turn_summary`, `results`), guards and actions, and returns an ordinary machine. `start`, `send`, `isFinal` and `validateMachine` work on it unchanged. As with `defineMachine`, there are two calls: the first fixes the types the game writes (item, turn record, events), and the second infers the names.

### What the format owns

- **Phases:** `handoff` (its `start` event begins the turn: a fresh turn record, the timer, the first item), `turn_summary` (its `next` event adds the turn's points to the team's score, then moves on to the next team's `handoff`, or to `results` after the last turn), and `results` (final).
- **Context:** the config chosen at setup, each team's score, whose turn it is, the round, `turnEndsAt`, the item pool and the item currently shown, and the game's turn record (`turn`).
- **Events:** `start`, `time_up` and `next`. The game only lists its own events, and the builder adds these three.
- **Guards and actions** the game may also use in its turn, such as `drawItem`. Their exact list is settled as they're built in this chapter (standard §7 is updated to match).

### What the game owns

- **`phases`:** must include `turn`, which `handoff` starts. It may add more (Trivia's `steal`). Its transitions may go only to its own phases or to `turn_summary`. A game phase can't be final, and can't reuse a format phase's name.
- **`time_up`:** the game decides what running out of time means in its turn. In Charades the turn just ends. In Trivia an unanswered question could go to `steal`.
- **`newTurn` and `points`:** the game's record of one turn (Charades: which items were got and skipped), and how many points that record is worth.
- **`guards` and `actions`:** its own. A name that's already one of the format's is a type error.

### Points are worked out from the turn record

The game doesn't add points to a score as the turn goes. It keeps a record of the turn, and `points(turn)` says what it's worth. The format adds that to the team's score when the players leave `turn_summary`.

This gives the turn summary one source of truth. The summary is "editable" (standard §7): if someone mis-tapped "got", the record is corrected and the points follow, so the two can never disagree. It also leaves room for Charades' later rules (double points for acting, a skip penalty, chapter 05): they change `points`, not the format.

### How Trivia's `steal` fits

```ts
phases: {
  turn: {
    interaction: 'multiple_choice',
    on: {
      answer:  [{ when: 'isCorrect', to: 'turn_summary', actions: ['markCorrect'] }, { to: 'steal' }],
      time_up: { to: 'steal' },
    },
  },
  steal: {
    interaction: 'multiple_choice',
    on: { answer: { to: 'turn_summary', actions: ['markSteal'] } },
  },
},
```

`steal` is an extra game phase that leads back into the format's loop through `turn_summary`. Points for the stealing team are part of the turn record. When Trivia is built, `points` (or a variant of it) will need to say which team gets them; that's a change to the format and gets its own decision record then.

### Mistakes that are type errors

All reported on the game's own line, checked with a prototype before this record was written:

- A typo in a phase name (`to: 'turn_sumary'`), a guard name or an action name.
- An action that's used but not written.
- A transition to `handoff` or `results`.
- No `turn` phase.
- A phase, guard or action with the same name as one of the format's.

### Rejected

- *(a) Copying the format's parts into `defineMachine`.* It's the trap ADR 0002 recorded: TypeScript learns names from both halves, so a typo can be reported inside the format's code instead of the game's. Nothing stops a game from overwriting `handoff`, and every game has to remember to copy three objects.
- *(c) The turn as its own machine.* The runner would have to run machines inside machines, with two layers of state to save and resume. That's a big change to the one piece everything depends on, for a problem (b) solves without it.
- *The format handles `time_up` itself.* Simpler for Charades, but Trivia needs time running out to lead somewhere else. One line in each game's turn is a small price for that.

## Consequences

- A team-turns game is a few dozen lines: its turn phase(s), its turn record, its scoring, and its own guards and actions. The loop, timer, item pool, scores and ending come from the format, and can't be changed by a game.
- A team-turns machine is still a plain machine: one runner, one save format, one way to test.
- The builder's types are the most complex code in the SDK. They are explained line by line where they're written (tutorial chapter 03), and guarded by compile-time tests.
- Standard §4's machine example (a whole Charades machine written with `defineMachine`) no longer shows how Charades is written. §4 and §7 are updated in this chapter.
- **Views.** Each phase is shown by one view (standard §5). The format will provide views for its own phases, and a game for its own. They're added to `defineGame` in chapter 04, as a required field keyed by phase name, so a game can't leave a phase without a view.
- **Not yet:** the optional `round_summary` phase from standard §7. It's added when a game or the app needs it, with a note in the standard.
