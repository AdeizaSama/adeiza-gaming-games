# 12 — This or That

**Goal of this chapter:** a fourth game, This or That: a quiz with two options a question. Its first pack is for French learners: "chaise: masculin or féminin?".

**Branch:** `chapter/12-this-or-that`

**Where this fits.** This or That plays exactly like Trivia Night. A game can't import another game, so the first step moves Trivia Night's turn into the SDK, where both use it. That's the shared multiple-choice template: the next quiz game is mostly content.

---

## Step 1: Deciding where the shared turn lives

**What:** [ADR 0017](../decisions/0017-a-shared-choice-turn-and-this-or-that.md). No code yet.

**Why:** This or That needed a home for rules it shares with Trivia Night. A preset of Trivia Night can't have its own name in the library or its own kind of question; a copy of Trivia Night's machine would drift apart from it.

| Lives in | What |
|---|---|
| `src/sdk/content/choices.ts` | A question's fields (`choiceFields`) and the option rules |
| `src/sdk/formats/team-turns/choice/` | Settings (`choiceConfig`), machine (`choiceTurns`), turn view, settings view |
| Each game | Its schema, defaults, presets, content, rules |

### How to verify

Read the ADR.

---

## Step 2: Trivia Night's turn, moved into the SDK

**What:**

| From | To |
|---|---|
| Trivia Night's question fields in `schema.ts` | `choiceFields` in `src/sdk/content/choices.ts` |
| `src/games/trivia-night/config.ts` (the settings) | `choiceConfig(defaults)` in `src/sdk/formats/team-turns/choice/config.ts` |
| `src/games/trivia-night/machine.ts` | `choiceTurns<Item>()` in `choice/machine.ts` |
| `views/TurnView.tsx` | `choiceTurnView<Item>(label)` in `choice/TurnView.tsx` |
| `views/SettingsView.tsx` | `ChoiceSettingsView` in `choice/SettingsView.tsx` |
| `machine.test.ts`, `views/views.test.tsx` | Next to them in `choice/`, on stand-in questions |

Trivia Night is now small:

```ts
export const TriviaConfig = choiceConfig()                 // config.ts
export const machine = choiceTurns<TriviaItem>()           // machine.ts
export const TurnView = choiceTurnView<TriviaItem>()       // index.ts, for turn and reveal
```

**Why:** a game can't import another game (standard §9), and This or That plays the same turn.

### Functions that make things

The machine and view take the game's item type, so they're functions a game calls once: `choiceTurns<TriviaItem>()` returns a machine typed for Trivia Night's questions. `choiceConfig` takes the game's defaults (This or That: ten questions a turn, A to Z) and keeps the limits the same for every game.

### Tests

The turn's tests moved with it and run on eight made-up questions, because SDK tests can't load a game's pack. The standard asks every game for a `machine.test.ts`, so Trivia Night keeps one: a full game on its real pack.

The moved tests keep their numbers in the test catalog: it's the same test, in a new place.

### How to verify

`pnpm test`: 434 tests. `pnpm generate-schemas` writes the same Trivia Night schema as before: the move changed no rule. Play Trivia Night: nothing has changed.
