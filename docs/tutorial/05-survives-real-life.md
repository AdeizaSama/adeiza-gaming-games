# 05 — Survives real life

**Goal of this chapter:** a refresh, a locked phone, a back swipe or a closed tab never loses a game, and quitting one is deliberate.

**Branch:** `chapter/05-survives-real-life`

**Where this fits.** Chapter 04 made Charades playable, but only in memory: anything that reloads the page starts over. That's fine at a desk and fatal at a party, where phones get locked, swiped and passed to someone who taps the wrong thing. This chapter makes a game outlast all of that:

- **Saving and resuming** a game.
- **Continue** from the library.
- **Quit** with a confirmation.
- **Remembered setup choices.**
- **Keeping the screen awake** during play.

---

## Step 1: Deciding how games are saved

**What:** [ADR 0006](../decisions/0006-save-and-resume.md), the design for saving and resuming. No code yet.

**Why:** a save outlives the code that wrote it. Whatever we save today has to be loadable, or safely rejected, by every later version of the app. That's a contract, so it's decided and written down before it's built.

### Where a website can keep things: `localStorage`

Each website gets a small store on the device, `localStorage`: text values under names (keys), kept until the site or the user deletes them. Chapter 04 already used it for team names (`ku-zo-wasa:teams`). It survives refreshes, closed tabs and restarts, never leaves the phone, and holds about 5 MB per site; a game is a few kilobytes.

The ADR lists what we didn't pick and why. The address bar is long and editable. `sessionStorage` is the same store but cleared when the tab closes, which is exactly what we're protecting against. IndexedDB is a full database, more than we need.

### What's saved: everything

The runner's whole state, `{ phase, context, rngState }`, plus a version number, the game's id and the time:

```json
{
  "version": 1,
  "gameId": "charades",
  "savedAt": 1793370000000,
  "state": { "phase": "turn", "context": { "scores": [2, 1], "turnEndsAt": 1793370042000, "…": "…" }, "rngState": 2843021 }
}
```

Saving `rngState` means a resumed game keeps the same "random" card order it would have had. That works because all randomness comes from the seeded Rng (chapter 01): the Rng's state is a single number, so it can be saved like anything else.

For this to work, a game's context has to survive being written as JSON and read back. Strings, numbers, arrays and plain objects do; a `Date` or a function doesn't. Contexts were already plain data; the standard will now require it.

### Old saves: check, and throw away what doesn't fit

The app will change while saves sit on phones. A save from last month might name a phase that's since been renamed, a game that was removed, or settings in an old shape. Loading it blindly would crash or show nonsense, so every load checks:

1. Is it readable, and the right shape?
2. Is its `version` today's version?
3. Is its game still in the registry?
4. Does that game's machine still have its phase?
5. Do its settings still pass the game's config schema?

Any "no" deletes the save and the library says "Your last game couldn't be restored." Losing an unfinished game after an update is a pity; crashing is worse.

The **version rule** covers what the checks can't see: any change to the shape of a saved context bumps the version, and every older save is discarded.

### Start saves, the play page loads

The play page will only ever play a save. Start creates the new game, saves it, and goes to the play page, which loads it. A refresh loads it too, and so does the library's Continue card: three ways in, one path. Each change during the game saves again.

This changes one thing from chapter 04: the setup screen stops passing settings along with the navigation (step 11). And `useGameSession` changes shape: it now plays a state it's given (new or saved) and reports every change, and a separate `newGame` creates new games. That's step 2.

### Files changed

- `docs/decisions/0006-save-and-resume.md` (new), and its row in `docs/decisions/README.md`.
- `docs/tutorial/05-survives-real-life.md` (new): this file.

### How to verify

Read ADR 0006. Each of the five checks should match a way a save can go stale that you can imagine happening. If you can think of a sixth, it belongs in the ADR before step 3 builds the checks.
