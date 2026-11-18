# 0013. A board that fits the screen, and standings after every turn

- **Status:** Accepted
- **Date:** 2026-11-18

## Context

Two things came up the first time Name Ten was played on a phone:

- **The board scrolled.** A turn shows the timer, the category, ten answers and an End button. With every answer a full-width row at least 44px tall (standard §12's smallest tap target), that's about 760px: taller than most phone screens. A judge scrolling mid-turn misses answers.
- **The turn summary only showed one team.** After review, the summary said "Lions scored 4 points" and nothing about the game: who's ahead, and how far through it you are.

Both are shared: the board is the SDK's `PromptCard`, and the summary is the team-turns format's default view, used by Charades and Name Ten.

## Decision

### The play screen is exactly the phone's height

The play screen (`GameScreen`) is now as tall as the screen, not at least as tall. Its views sit in an area that scrolls on its own when a view is taller than the screen (a long review list, say), so the quit bar stays put.

That gives a view a known height to fill. `PromptCard` uses it: its board is **two columns of answer tiles that share the height left**, each at least 44px. Ten answers are five rows; fifteen are eight. On a tall phone the tiles grow; on a small one they stay at 44px, and only then does the board scroll.

We rejected shrinking single-column rows below 44px (too easy to tick the wrong answer at speed) and smaller text (the judge reads at a glance, mid-shout).

### The turn summary shows standings

The format's turn summary keeps "Lions scored 4 points", and adds every team, in playing order: its score so far (this turn included), and one dot per round, filled for each round it has played. The team that just played is highlighted.

```
Lions     13   ● ● ○
Eagles     9   ● ○ ○
```

The scores include this turn even though the format banks them when players leave the summary (ADR 0004): what players see matches what the results will say.

`Summary` gets an optional `standings` list for this; a game that replaces the turn summary can pass its own.

## Consequences

- **Easier:** the judge sees the whole board without scrolling, and every turn ends with the state of the game.
- **Harder:** a play view that wants the page to scroll as a whole can't; it scrolls inside the play area.
- **SDK change:** `PromptCard` lays out as a grid that fills its space; `Summary` takes `standings`; the team-turns turn summary passes them.
