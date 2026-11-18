# 0014. A phase before the turn

- **Status:** Accepted
- **Date:** 2026-11-18

## Context

Name Ten lets a team turn down a category it doesn't like, up to three times, before its minute starts. That's a screen between the handoff and the turn: the team sees a category, then plays it or skips to the next. Skipping is for good: a skipped category doesn't come back.

The team-turns format (ADR 0004) didn't allow it. A game's phases come after the format's handoff, whose Start goes straight to the game's `turn`, starts the timer and draws the first item, in one step. Games could add phases after the turn (Charades' review) but not before it. ADR 0012 noted this and left category choice out.

## Decision

### A game may name one phase that comes before its turn

`teamTurns` takes an optional `beforeTurn`: the name of one of the game's own phases. When it's set, the handoff's Start goes there instead of to `turn`, with a fresh turn record and the first item drawn (and the game's `onStart` actions run), but **no timer**. The game's phase decides what happens next, and goes on to `turn` when the team is ready.

Without `beforeTurn`, nothing changes: Start goes straight to the turn, as before.

### The timer starts when the turn does

The format's `startTurn` (a fresh turn record and the timer, at once) splits in two:

- `resetTurn`: a fresh turn record. The handoff's Start always runs it.
- `startTimer`: the turn ends `config.seconds` from now. The handoff runs it when there's no phase before the turn; otherwise the game's phase runs it on its way into `turn`.

A pre-turn phase that could reach the turn without starting the timer would be a turn that never ends. `teamTurns` checks it when the machine is built, and throws, naming the phase and event, if any of the phase's transitions to `turn` leaves out `startTimer`. It also throws if `beforeTurn` names a phase the game doesn't have.

### Name Ten: choosing a category

Name Ten's `category` phase shows the category drawn (its name only: the answers stay hidden). The team can:

- **play it**: the timer starts and the turn begins on that category's board;
- **skip it**, up to three times a turn: the next category is drawn and its board dealt. The skipped one counts as drawn, so it's gone for the rest of the game, as a played one is.

The skips used are part of the turn record, so they're saved and a refresh can't give a team its skips back.

`FlashCard` shows the category, with its buttons labelled Play this and Skip. It gets an optional `skipDisabled`, so Skip is off when no skips are left.

## Consequences

- **Easier:** any team-turns game can show something before the clock runs: a category, a question's topic, a role.
- **Harder:** a game with a phase before its turn must start the timer itself. `teamTurns` refuses to build one that can forget.
- **SDK change:** `teamTurns` takes `beforeTurn`; `startTurn` is replaced by `resetTurn` and `startTimer`; `FlashCard` takes `skipDisabled`. Saved games are unaffected: only phase names and the context are saved, and neither changes for existing games.
