# 10 — Name Ten

**Goal of this chapter:** a second game, Name Ten: a team gets a category and a minute to name ten things in it, while a judge from another team ticks them off a board of answers.

**Branch:** `chapter/10-name-ten`

**Where this fits.** Charades built the SDK; Name Ten tests it. It's also a check on CONTRIBUTING: as we go, we note every point where the public docs didn't answer a question a contributor would have, and the chapter ends by writing the step-by-step guide CONTRIBUTING promised.

---

## Step 1: Deciding how Name Ten plays on one phone

**What:** [ADR 0012](../decisions/0012-name-ten.md). No code yet.

**Why:** two questions shape everything else: how answers are counted, and who holds the phone.

### An answer board

Each category comes with ten to twenty answers. A turn deals ten of them (a setting, 10–15) onto a board, and a point is an answer on the board that the team said. A counter (+1 for anything the judge accepts) would be simpler, but every turn would turn into an argument.

### A judge from the next team

The board shows the answers, so nobody on the guessing team can hold the phone. It goes to a judge from the next team in playing order.

### Reused, and new

Review after the turn is Charades' review, reused. New to the SDK: `PromptCard` (the board) and a `lead` line on `Handoff` ("Hand the phone to a judge from").

### How to verify

Read the ADR. Steps 2–7 build it; step 8 writes the docs.

---

## Step 2: Categories and their answers

**What:**

- `src/games/name-ten/schema.ts`: a content item is a category, its answers and tags.
- `src/games/name-ten/content/back-to-school.json`: 38 categories, each tagged school, food, games, home, culture, music, tv or tech.
- `schemas/name-ten.pack.schema.json`, generated.

**Why:** content comes first: it's what the machine deals and the board shows.

### The rules a category must pass

| Field | Rule | Why |
|---|---|---|
| `category` | 1–60 characters | It's read aloud and shown at the top of the board |
| `answers` | 10–20, each 1–50 characters, no repeats (ignoring case and spaces) | A board deals up to 15; a list longer than 20 means people will shout answers that aren't there |
| `tags` | Optional, kebab-case | Filtering, as in Charades |

Repeats use the SDK's `findDuplicates`, the same comparison packs use for repeated items, so "Zero" and " zero " are the same answer.

### What a contributor gets for free

The content check and `pnpm generate-schemas` found the new game folder by themselves: no list to add it to. One answer in the original list was 42 characters; the limit is 50, the same as a Charades card.

### How to verify

- `pnpm test src/games/name-ten`: tests 344–349.
- `pnpm validate-content` lists `src/games/name-ten/content/back-to-school.json (38 items)`.

---

## Step 3: Settings

**What:** `src/games/name-ten/config.ts`: `TeamTurnsConfig` plus `shown`, the answers on the board (10–15, default 10).

**Why:** the board's size is the one setting Name Ten adds. Turn length, rounds, packs and tags come from the format, as they did for Charades.

The minimum of 10 matches the content rule from step 2: every category has at least 10 answers, so a board is never short. The maximum of 15 keeps the board scannable in a minute.

### How to verify

`pnpm test src/games/name-ten`: tests 350–351.
