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
