# 0015. Trivia Night: multiple choice, three ways to play

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

Trivia Night is the third v1 game (standard §8). A team gets a question with a few options, taps one, and finds out at once whether it was right. The phone stays with the team: nothing on screen gives the answer away until they've tapped.

Three things needed deciding: what a question looks like on screen, what a content item is, and what a turn is. The standard listed `MultipleChoice` as a planned primitive and Trivia Night on the team-turns format; it didn't say how many questions make a turn.

Other games will want the same card. A language drill ("masculin or féminin?") is a question with two fixed options; a true-or-false quiz is a question with two. So the card and the item rules belong in the SDK, not inside Trivia Night.

## Decision

### `MultipleChoice`: the question on top, its options below

A new SDK primitive (`src/sdk/interactions/MultipleChoice.tsx`):

- **The question takes most of the screen**, about two thirds, and the options the rest. The options never get smaller than a 44px tap target (standard §12): when they need more than a third (a small phone, long options), the question gives up space instead. The split is a target, not a rule.
- **2 to 5 options, as tiles two to a row:** 2x1 for two, 2x2 for four. With three or five, the last tile takes the whole row, so the grid has no empty cell. A list, one option per row, was tried first; tiles are the shape players expect from a quiz, and leave each one taller. The cost: at half width, a long option wraps to several lines.
- **After a tap**, the options lock, the right one turns green with a tick, a wrong pick turns red with a cross, and a line says which: "Right!" or "Not quite: it's Lagos." The primitive only shows this; the machine decides what it's worth.

### Choices: the item rules, shared

`src/sdk/content/choices.ts` gives games the rules for a question's options, so every multiple-choice game checks them the same way:

- `Options`: 2 to 5 options, each 1–80 characters, none repeated (ignoring capitals and spaces).
- `checkAnswer`: the answer must be one of the options, written the same way.
- `orderOptions(options, order, rng)`: the order they're shown in. `shuffle` (a new order every time the question comes up, from the machine's random numbers, so a saved game shows the same order) or `alphabetical` (A to Z, numbers in number order, so "8" comes before "12"). A game that needs its own fixed order (masculin always left) uses the options as written.

### A Trivia Night question

```json
{ "question": "What is 7 × 8?", "options": ["56", "54", "48", "64"], "answer": "56", "tags": ["maths"] }
```

The standard's earlier sketch had a `difficulty`. No question has one yet and nothing uses it, so it's left out until a setting needs it. Images are left out too: content is text only in v1 (standard §8), and an image needs a source and a license we can check. The card has room to add one later.

### A turn: one question, a set number, or against the clock

A setting, `mode`:

- **Questions** (the default): a turn is a set number of questions, `questions`, 1 to 10, default 1. The turn ends when the last one is answered, or when time runs out.
- **Against the clock**: questions keep coming until time runs out.

The clock is the format's, and runs for the whole turn, as in every team-turns game: the setup screen calls it "Turn length". With one question a turn, that's the time for the question; Trivia Night's default turn is 30 seconds. With five questions, the team has the whole turn for all five.

Other settings:

- `points`: points per right answer, 1 to 5, default 1. A wrong answer costs nothing.
- `order`: `shuffle` (default) or `alphabetical`.

Presets: **One question** (the defaults: 3 rounds, 30 seconds), **Five questions** (5 a turn, 120 seconds) and **Against the clock** (60 seconds).

### Phases

The format's handoff gives the phone to the team playing. Then:

- `turn` shows the question. `answer` (with the option's position) records the pick and goes to `reveal`. `time_up` goes to the turn summary.
- `reveal` shows the result. `continue` draws the next question and goes back to `turn` while there's one to come (always, against the clock), or else goes to the turn summary. `time_up` goes to the turn summary. On the last question of a set, the clock is hidden, so the reveal isn't cut short.

No review: the app knows the answer, so there's nothing to correct.

### Not in this version

- **Steals** (another team answers a question the first got wrong): the standard's sketch. They need a turn to pass between teams, which the format doesn't do.
- **Choosing a category before the turn**: Name Ten's `beforeTurn` (ADR 0014) makes it possible later.

## Consequences

- **Easier:** a new multiple-choice game is a schema that uses `Options` and `checkAnswer`, and a turn view that uses `MultipleChoice`.
- **Harder:** a mode setting means three turn shapes to test, and the setup screen's "Turn length" means the whole turn, not one question, in a five-question game.
- **SDK change:** a new primitive and a new content helper. No change to the format or to existing games.
