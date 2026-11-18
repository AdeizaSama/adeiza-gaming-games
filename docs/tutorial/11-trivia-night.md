# 11 — Trivia Night

**Goal of this chapter:** a third game, Trivia Night: a team gets a question and a few options, taps one, and finds out at once if it was right. It plays three ways: one question a turn, a set number, or as many as the team can answer against the clock.

**Branch:** `chapter/11-trivia-night`

**Where this fits.** Name Ten added a board to the SDK; Trivia Night adds a multiple-choice card. The card and the rules for a question's options go in the SDK, not the game, so the next multiple-choice game (a true-or-false quiz, or a "masculin or féminin?" drill) starts with them.

---

## Step 1: Deciding how Trivia Night plays

**What:** [ADR 0015](../decisions/0015-trivia-night.md). No code yet.

**Why:** three questions shape everything else: what the card looks like, what a question is in a content file, and what a turn is.

### The card

The question takes about two thirds of the screen and its options the rest, one per row. Options never shrink below a 44px tap target, so on a small phone with five options the question gives up space instead. After a tap, the right option turns green and a wrong pick red.

### A question

A question, 2 to 5 options, and the answer, which must be one of the options. The option rules (`Options`, `checkAnswer`) and the order they're shown in (`orderOptions`: shuffled, or A to Z) live in `src/sdk/content/choices.ts`, for any multiple-choice game.

### Three ways to play

| Mode | A turn is | Ends when |
|---|---|---|
| Questions, 1 (default) | One question | It's answered, or time runs out (30 seconds by default) |
| Questions, 2–10 | That many questions | The last is answered, or time runs out |
| Against the clock | As many as the team can answer | Time runs out |

The clock is the format's turn timer, so in a five-question game it covers all five.

### Left out

Images (text only in v1, and an image needs a license we can check), steals (a question passing to the next team) and choosing a category first.

### How to verify

Read the ADR. The steps after it build it.

---

## Step 2: The rules for a question's options

**What:** `src/sdk/content/choices.ts` and its tests.

**Why:** every multiple-choice game checks options the same way, so the rules live in the SDK, next to `findDuplicates`, not in Trivia Night.

| Export | What it does |
|---|---|
| `Options` | A zod schema: 2 to 5 options, each 1–80 characters, none repeated (ignoring capitals and spaces) |
| `checkAnswer` | Used with `.superRefine` on a whole item: the answer must be one of the options, written the same way |
| `OptionOrder`, `orderOptions` | `shuffle` (from the machine's `rng`, so a refresh shows the same order) or `alphabetical` |

`checkAnswer` works on the whole item because it compares two fields; zod checks each field first, then runs it.

The alphabetical order uses `Intl.Collator` with `numeric: true`. A plain `.sort()` compares character by character, so "12" comes before "8" and "Year 10" before "Year 9": wrong for a quiz about numbers.

### How to verify

`pnpm test src/sdk/content/choices.test.ts`: 5 tests. Break `checkAnswer` (make it never add an issue) and the answer test fails; replace the collator with a plain `.sort()` and the alphabetical test fails.

---

## Step 3: The multiple-choice card

**What:** `src/sdk/interactions/MultipleChoice.tsx` and its tests; the standard's §6 row for it says Built.

**Why:** the card is the part every multiple-choice game shares. Trivia Night's view will be a header, this card, and a button.

### Props

`question`, `options` (in the order to show them), `answer` (the right option's position), `picked` (null while the question is open) and `onPick`. The card doesn't decide anything: it shows the result once `picked` is set, and the machine works out what it's worth.

### Two thirds and one third, mostly

```tsx
<div className="flex min-h-0 flex-[13_1_0%] …">   {/* the question */}
<ul className="flex flex-[7_0_0%] flex-col gap-2"> {/* the options */}
  <li className="flex min-h-11 flex-1">
```

Both start from a basis of 0 and share the height 13 : 7 (about 65 : 35). A flex item can't get smaller than its content unless told to, and the options aren't told to, so when five 44px rows need more than a third, they take it. The question has `min-h-0`, so it's the one that gives way, and scrolls if it must.

### After a tap

The answer turns green with a tick, a wrong pick red with a cross, and the rest fade. The buttons use `aria-disabled`, not `disabled`: a disabled button is faded by the theme, which would fade the result too.

### How to verify

`pnpm test src/sdk/interactions/multiplechoice.test.tsx`: 4 tests. Let a tap through after the pick, and the "ignores later taps" test fails.

---

## Step 4: Questions, and the Back to School pack

**What:**

- `src/games/trivia-night/schema.ts`: a question, 2 to 5 options, the answer, and tags.
- `src/games/trivia-night/content/back-to-school.json`: 148 questions, each tagged with its subject: maths, science, social-studies, entertainment or general.
- `schemas/trivia-night.pack.schema.json`, generated with `pnpm generate-schemas`.

**Why:** content comes first: it's what the machine draws and the card shows.

### Using the SDK's rules

```ts
export const itemSchema = z
  .strictObject({ question, options: Options, answer, tags })
  .superRefine(checkAnswer)
```

`Options` and `checkAnswer` come from step 2. The game adds only what's its own: a question of at most 150 characters, and tags.

### Checking every question

The pack started from an older Back to School set, and each question was checked against one test: **could someone who knows the subject defend a different option?** The app marks the pick, with nobody to overrule it, so a second defensible answer marks a right team wrong. Four failed:

| Question | Problem | Fix |
|---|---|---|
| What is Ben 10's watch called? | Ultimatrix is an option, and is his watch in the later series | "In the original Ben 10 series…" |
| What do you shout when you play your second-to-last card in Whot? | "Semi card!" is close to the real "semi-last card" | Ask about one card left |
| As busy as a ___ | "Busy as a beaver" is a saying too | Beaver replaced by Goat |
| 'Shine shine bobo' advertised which drink? | Couldn't be confirmed | Dropped |

### How to verify

`pnpm test src/games/trivia-night/schema.test.ts`: 5 tests. `pnpm validate-content` lists `trivia-night` with 148 items.

---

## Step 5: Settings

**What:** `src/games/trivia-night/config.ts` and its tests.

**Why:** the three ways to play are settings, so a preset can pick one.

| Setting | Values | Default |
|---|---|---|
| `mode` | `questions`, `clock` | `questions` |
| `questions` | 1–10 a turn (ignored against the clock) | 1 |
| `points` | 1–5 for a right answer | 1 |
| `order` | `shuffle`, `alphabetical` | `shuffle` |
| `seconds` (the format's) | 10–300 | **30**, not the format's 60 |

Changing a format setting's default without copying its limits:

```ts
seconds: TeamTurnsConfig.shape.seconds.unwrap().default(30),
```

`.unwrap()` takes the default off the format's field, leaving its `min(10).max(300)`, and `.default(30)` puts Trivia Night's on.

### How to verify

`pnpm test src/games/trivia-night/config.test.ts`: 2 tests.

---

## Step 6: The machine

**What:** `src/games/trivia-night/machine.ts` and its tests.

**Why:** the rules from ADR 0015, as phases.

```
handoff ──start──▶ turn ──answer──▶ reveal ──continue──▶ turn          (another question to come)
                    │                 │      └─continue──▶ turn_summary (the last one)
                    └──time_up──▶ turn_summary ◀──time_up──┘
```

- **The turn record** is `{ options, picked, results }`: the options in the order shown (so a refresh shows the same card), the pick (null while the question is open), and right or wrong for each question answered. Points are the right answers times the `points` setting.
- **`answer` goes to its own phase, `reveal`,** so a second tap can't change the pick: `reveal` doesn't listen for `answer`.
- **`continue` has two transitions, tried in order.** The first, guarded by `moreQuestions`, draws the next question; the second, with no guard, ends the turn. `moreQuestions` is always true against the clock, so only time ends that turn.
- **`dealOptions`** runs when the format draws the first question (`onStart`) and after each `drawItem`, and puts the options in the order the setting asks for (step 2's `orderOptions`).

The event is `continue`, not `next`: the format already uses `next` to leave the turn summary.

### How to verify

`pnpm test src/games/trivia-night/machine.test.ts`: 12 tests. Make `moreQuestions` always true, and the one-question and set-number tests fail; make every pick right, and the scoring tests fail.

---

## Step 7: The views

**What:** in `src/games/trivia-night/views/`, `TurnView.tsx` (the turn, and the result), `SettingsView.tsx` (on setup), and their tests. `machine.ts` gets `moreToCome`, used by both the `moreQuestions` guard and the view.

**Why:** the views are the machine's phases on screen.

### One view for two phases

`turn` and `reveal` both use `TurnView`: the card is the same, and `picked` says which it is. Under the card, a button appears after the pick: **Next question** while there's one to come, **End turn** after the last. It's in place but invisible before, so the card doesn't jump when it appears.

The clock is hidden on the last question's result. Otherwise time running out while the team reads the result would skip it. Both the guard and the view ask `moreToCome`, so they can't disagree about which question is the last.

The header says how far into the turn the team is: "Question 2 of 5", "Question 2" against the clock, and nothing when a turn is one question.

### Settings

Mode (Set questions or Against the clock, with Questions per turn only for the first), Points for a right answer, and Order of the options.

### How to verify

`pnpm test src/games/trivia-night/views`: 6 tests. Always show the clock, and the "without the clock" test fails.
