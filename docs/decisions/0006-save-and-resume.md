# 0006. Save and resume

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

Until now a game lived only in memory. A refresh, a back swipe, the browser closing the tab in the background, or a phone running out of memory all lost it. On one phone passed around a room, all of these happen.

Constraints:

- **No backend** (standard §8). Anything saved stays on the device.
- **One phone, one group.** Nobody plays two games at once on one phone.
- **The clock doesn't stop for a refresh.** A turn's end time is a moment (`turnEndsAt`), not a number of seconds left (ADR 0004).
- **Saves outlive the code that wrote them.** A phone can keep a save for weeks, while the app is updated underneath it. A phase can be renamed, a game removed, a setting added. Loading a save like that must never crash: the runner fails on a phase it doesn't know (ADR 0002).

## Decision

### What's saved

One game per device, in the browser's `localStorage` under `ku-zo-wasa:game`:

```ts
interface SavedGame {
  version: number        // the save format, see below
  gameId: string         // which game, e.g. "charades"
  savedAt: number        // when, for "saved 5 minutes ago"
  state: MachineState    // phase, context, rngState: exactly what the runner holds
}
```

The **whole machine state** is saved, not a summary to rebuild from. It includes `rngState`, so a resumed game draws the same cards it would have drawn anyway, and the item pool, scores and turn record as they were. Resuming is "carry on", never "start again and replay".

This needs every game's context to be **plain data**: what `JSON.stringify` can write and `JSON.parse` gives back unchanged (strings, numbers, booleans, `null`, arrays, plain objects). No functions, `Date`s, `Map`s or class instances. Team-turns contexts already are; the standard now says so.

### When it's saved

- **Start creates the game and saves it** before going to the play page. Creating a game means picking a random seed, so the SDK gets `newGame(machine, input)`, next to the session hook. That keeps a single place where seeds are chosen (standard §4).
- **The session saves after every change**: each event that changes the state, and Play again.
- **The play page only plays the save.** It doesn't receive settings from the setup screen any more (chapter 04 passed them as navigation state). So a refresh, the Continue card and arriving from Start are one path: load the save, play it. With no usable save for that game, it goes back to setup.

Setup choices are saved separately, per game (`ku-zo-wasa:setup:<gameId>`), as players edit them. Team names stay shared across games, as in chapter 04.

### Loading checks everything that can be stale

`loadGame` reads the save and returns one of:

| Result | When |
|---|---|
| a game | the save passes every check below |
| nothing | there's no save |
| **discarded**, with the reason | not readable JSON, or not the shape above · a different `version` · a `gameId` not in the registry · a `phase` the game's machine doesn't have · settings the game's config schema rejects |

A discarded save is deleted, and the library says once: "Your last game couldn't be restored."

The rest of the context isn't checked field by field: that would mean a schema for every game's context. The `version` covers it instead.

### The version rule

`version` is one number for the whole app. **Bump it in any change that alters the shape of a saved context**: a field added, renamed or removed in a format's or a game's context, or in its items or turn record. Every older save is then discarded with a notice instead of loaded wrong.

A version per game was considered and rejected for now: it would only matter with several games, and the cost of the single number is one lost unfinished game per device after such an update.

### Finished games

A game at its results is still saved, so a refresh on the results keeps them. It isn't offered as Continue, and starting a new game replaces it without asking. An unfinished save is only replaced after "Replace your saved game?".

### Time

Nothing pauses. On resume during a turn, the countdown shows the time left until `turnEndsAt`; if that has passed, it sends `time_up` straight away (it already does, chapter 04 step 7), and the turn ends. Pausing is a separate format change, not scheduled.

### The session hook's new shape

```ts
const game = newGame(machine, input)              // a new game: picks the seed
const session = useGameSession(machine, game, {   // plays a given state
  onChange: (state) => save(state),               // after every change
})
session.restart(input)                            // Play again: a new game from this input
```

Before, `useGameSession(machine, input, { seed })` created the game itself. Now it plays whatever state it's given, new or saved, and `onChange` reports each change. It still doesn't save anything itself: the SDK knows nothing about storage. `onChange` runs after React has drawn the new state, not during the update, because a save is a side effect.

### Where the code lives

The save store is app code (`src/app/play/savedGame.ts`): checking a `gameId` needs the registry, which only the app may import (standard §9). Games and the SDK don't touch storage.

### Rejected alternatives

| Option | Why not |
|---|---|
| The state in the address (`?state=…`) | Long, editable by hand, and shown in shared links. |
| `sessionStorage` | Cleared when the tab closes, which is one of the ways games get lost. |
| IndexedDB | Built for large data and needs asynchronous code; a game is a few kilobytes. |
| Several saved games | One phone, one group: nobody needs a list, and choosing from one is extra taps. |
| Rebuilding from the settings and a list of past events | Exact too, but every resume replays the whole game, and an old event list breaks in the same ways an old state does. |

## Consequences

- A refresh, back swipe, closed tab or locked phone never loses more than the seconds that passed.
- Contexts must stay plain data, and context changes must bump the version. The standard and the PR checklist say so.
- `useGameSession`'s signature changes; its one caller (`GameScreen`) and its tests change with it.
- The setup screen no longer passes settings to the play page; Start saves and navigates.
- `localStorage` can be full or switched off (some private browsing modes). Saving then fails quietly and the game still plays, just without a save, like before this chapter.
