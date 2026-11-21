# 0019. Free Play

- **Status:** Accepted
- **Date:** 2026-11-21

## Context

Some variants are as good alone as in a group: Masculin ou féminin ? is practice for one French learner on a bus as much as a party game. But the team-turns format (ADR 0004) needs at least two teams, hands the phone round between turns, and times every turn.

Not every game can be played alone. In Charades someone has to guess; in Name Ten someone has to judge. So playing alone is something a variant offers, not something every game gets.

## Decision

### Free Play and Competitive

A variant that offers it has two ways to play, chosen with two tabs at the top of its setup screen:

- **Competitive:** teams, rounds and turns, as before.
- **Free Play:** one player, at their own pace. No teams, no hand-off screens, and no clock unless they pick Against the clock. The game is a set number of questions (10, 20 or 50), then their score.

The home page keeps one card per variant. The tab players last used is remembered.

### Two format settings

`TeamTurnsConfig` gets:

- `solo` (default false): one player. The teams list must then be exactly one name ("You"); otherwise at least two, as before.
- `timer` (default true): when false, `startTimer` sets no end to the turn, so it lasts until the game's own rules end it. Views already hide the countdown when there's no end.

A Free Play game is one round of one turn. With `solo`, the format's default views get out of the way: the hand-off starts the turn by itself, the turn summary goes on to the results by itself, and the results say "Your score" instead of who won. The phases don't change, so saving, resuming and Play again work as before.

### Who offers it

- A **variant** says `"freePlay": true`.
- A **game** allows that by giving `config.freePlay`: its Free Play settings view on setup, and the settings Free Play starts from (the app doesn't know what a game's settings are called). `defineGame` refuses a variant with `freePlay` in a game without one, so a Charades variant can't offer something Charades can't do.

The choice turn (ADR 0017) gives its view: the length (10, 20 or 50 questions, or Against the clock), and the clock's length when it's on. Its `questions` setting goes up to 50 (Competitive setup still offers 1 to 10 a turn).

## Consequences

- **Easier:** any multiple-choice variant can offer practice alone with one line in its file.
- **Harder:** two default views now behave differently with one player, and a view that sends an event by itself has to be tested for it.
- **Format change:** two settings and a rule across settings; existing games and saves are unchanged (both default to how things were).
