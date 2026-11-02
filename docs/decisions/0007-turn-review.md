# 0007. Turn review

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

A turn of Charades is loud and fast. Mistakes happen on almost every turn: someone taps Skip when the team had it, taps Got on a guess that was wrong, or the team shouts the answer just as the buzzer goes. Until now the turn summary only showed the result, and the item on screen when time ran out was never counted. Name Ten (phase 3) has the same problem in a different shape, and the reference app it comes from solved it with a review screen.

The Game Standard planned for this as a `Summary` primitive "with editable results". Charades also needs its points to depend on settings: chapter 06 lets players choose how much a correct describe, act or sing is worth, and how much a skip costs. A turn's points then can't be worked out from the turn alone.

Constraints:

- **The format's loop stays the same** (ADR 0004): `handoff` → the game's turn → `turn_summary` → the next team or `results`.
- **Corrections are part of the game**, so they must be saved and resumed like everything else (ADR 0006), and stay deterministic (standard §4).
- **A correction must be deliberate.** Review is shown to everyone while the phone goes round. A stray tap there shouldn't change a score.

## Decision

### Review is a game phase, before the summary

After time runs out, the turn goes to a **review** phase, and from there to the turn summary:

```
handoff → turn → review → turn_summary → handoff (next team) or results
```

The format needs no change for this. Its games can already add phases between `turn` and `turn_summary` (ADR 0004), so `review` belongs to the game. Charades' review lists every card of the turn in the order it was played, each with its result:

| Result | When | Tapping it in review makes it |
|---|---|---|
| Got it | the team tapped Got | Skipped |
| Skipped | the team tapped Skip | Got it |
| Not counted | it was on screen when time ran out | Got it, and tapping again makes it Not counted |

### Locked until the host taps Adjust

Results in review are **locked**. An **Adjust** button unlocks them; then a tap changes a card's result. Locking is screen state, not game state: a refresh locks the list again, and changes already made stay, because each change is a machine event (`toggle`, with the card's position) and saved.

### A new `Review` primitive; `Summary` stays read-only

The shared part is a new primitive, `Review` (standard §6): a list of rows with a result each, locked until Adjust, and a Done button. Name Ten will reuse it. `Summary` stays a read-only recap, and the standard's row for it changes from "editable results" to that.

We rejected making the summary editable. The summary is where points are added up, right before the phone goes to the next team. Corrections there mean showing scores that are still changing on the screen that hands over the turn. Two screens with one job each are easier to read and to test.

### The turn record is a log

Charades' turn record becomes a list of entries in play order, `{ item, mode, result }`, instead of separate lists of got and skipped items. The order is what review shows, and a position in the list is how a correction names a card.

### `points` receives the settings

The game's `points` function becomes `points(turn, config)`, so a game can score by settings. The format passes `context.config` when it banks points, and views get the same function. Games that don't need settings ignore the second argument.

## Consequences

- **Easier:** mistakes are fixed before they count, and the buzzer-beater argument has an answer on screen. The next team-turns game with corrections reuses `Review` and writes only its own toggles.
- **Easier:** any team-turns game can make its scoring a setting.
- **Harder:** one more screen per turn. Done is the only tap needed when nothing is wrong.
- **Saved games:** the turn record and settings change shape, so `saveVersion` goes to 2 (ADR 0006). Games saved before the update are discarded with the notice.
- **SDK change:** `TurnRecord.points` and `TeamTurnsViewProps.points` take the settings as a second argument.
