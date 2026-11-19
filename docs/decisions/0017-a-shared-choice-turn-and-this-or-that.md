# 0017. A shared multiple-choice turn, and This or That

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

This or That is a quiz with two options a question: "chaise: masculin or féminin?". It plays exactly like Trivia Night (ADR 0015): a question, a pick, the result, and a turn of one question, a set number, or as many as the team can answer against the clock. Only its content and defaults differ.

The standard calls a game with the same rules and different settings and content a variant, but a variant can't appear in the library as its own game, and players should find This or That by name. And a game can't import another game's files (standard §9), so This or That can't use Trivia Night's machine and views. Copying them would give two copies of the same rules to drift apart.

## Decision

### The turn moves into the SDK

Trivia Night's turn becomes the SDK's **choice turn**, in `src/sdk/formats/team-turns/choice/`, for any multiple-choice game on the team-turns format:

| File | What it gives a game |
|---|---|
| `config.ts` | `choiceConfig(defaults)`: the format's settings plus `mode`, `questions`, `points` and `order`, with the game's own defaults |
| `machine.ts` | `choiceTurns()`: the machine (`turn` and `reveal`, `isOption`, `moreQuestions`, `dealOptions`, `pick`), `moreToCome`, and the turn and event types |
| `TurnView.tsx` | `choiceTurnView(label)`: the question and its result, auto-next against the clock, the label above the question |
| `SettingsView.tsx` | Mode, questions per turn, points and option order on setup |

A question's fields (`question`, an optional `subtitle`, `options` and `answer`) join the option rules in `src/sdk/content/choices.ts`, as `choiceFields`, so a game's `schema.ts` can use them.

Trivia Night keeps its schema, content, defaults, presets and rules, and gets everything else from the SDK. Nothing about how it plays changes, and its saved games still load: the phases, context and events are the same.

### This or That

A game of its own (`src/games/this-or-that/`), on the choice turn:

- **A question has exactly two options.** The schema checks it.
- **Defaults:** ten questions a turn, 60 seconds, options A to Z, so both options are in the same place for every question in a pack.
- **Presets:** Ten words (the defaults) and Against the clock (60 seconds).
- **The card's label** is "This or that?".

Its first pack is **Masculin ou féminin ?**: French A1 words, each with its English meaning as the subtitle, and the options Masculin and Féminin. Nouns are shown without their article, which would give the answer away. A word that's the same in both genders (un or une élève; rouge) is left out, since either answer would be right. Words with two forms (acteur and actrice; petit and petite) are in as two questions.

### Rejected

- **A Trivia Night preset.** It can't have its own name, rules or defaults in the library, and a preset can't change what a question is (two options).
- **A copy of Trivia Night's machine in This or That.** Two copies of one set of rules.
- **The options once for the whole pack.** Every question lists Masculin and Féminin again. A pack-level field would mean a change to the pack format for one game; the repetition is easier to read than to explain.

## Consequences

- **Easier:** another multiple-choice game is a schema, settings defaults, content, rules and an `index.ts`.
- **Harder:** a change to the choice turn changes both games, so its tests live in the SDK.
- **SDK change:** `src/sdk/formats/team-turns/choice/`; `choiceFields` in `choices.ts`.
