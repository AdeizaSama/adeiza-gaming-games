# 15 — Pairs

**Goal of this chapter:** a fourth game, Pairs, for learning vocabulary three ways: flip cards, match-up (find the partners of three words among ten tiles) and odd-one-out (find the three words that aren't in a group). It starts with French.

**Branch:** `chapter/15-pairs`

**Where this fits.** Variants (chapter 13) and Free Play (chapter 14) made it cheap to offer many ways to play. Pairs is the first game built to be played mostly through them: one game, three ways to play, each a variant.

---

## Step 1: Deciding what a pair is, and how the three ways share it

**What:** [ADR 0020](../decisions/0020-pairs.md). No code yet.

| Decision | Why |
|---|---|
| One game with a `play` setting, not three games | All three read pairs; a variant picks the way |
| A pair is `{ front, back }`; packs are two-way or one-way | "le chat ↔ cat" is a pair of words; "le chat → les animaux" is a word and its group |
| The game's own phases are `turn` and `reveal` | The same shape as the choice turn: something to answer, then the result |
| Two new primitives, `FlipCard` and `PickCard` | Nothing in the SDK flips a card or picks several tiles |

### How to verify

Read the ADR.

---

## Step 2: Pairs, and two French packs

**What:**

- `src/games/pairs/schema.ts`: a pair, `{ front, back, tags }`, each side at most 60 characters.
- `src/games/pairs/content/francais-anglais.json`: 190 nouns with their article and English meaning ("le chat" ↔ "cat"). Two-way.
- `src/games/pairs/content/les-themes.json`: the same nouns, and jobs in both forms, with their theme ("le chat" → "les animaux"). One-way, eleven themes.
- `schemas/pairs.pack.schema.json`, generated.

**Why:** both packs come from the word list checked for Masculin ou féminin ?, so the French has been reviewed once already.

### Built, then checked

A script turns the word list into both packs. It adds the article from the gender ("le", "la", or "l'" before a vowel or a silent h), and refuses to write the two-way pack if two nouns share an English meaning: match-up would mark a right tile wrong. That's why the two-way pack has nouns only, without jobs and adjectives, where "actor" or "small" fit two French words.

One thing an article can't do: "l'école" doesn't show that école is feminine. Masculin ou féminin ? covers those.

### How to verify

`pnpm test src/games/pairs/schema.test.ts`: 3 tests. `pnpm validate-content` lists both packs.

---

## Step 3: Settings

**What:** `src/games/pairs/config.ts`: the format's settings plus `play` (`flip`, `match`, `odd`; default flip), `twoWay` (default true) and `cards` (1–50 a turn, default 10).

**Why:** a variant picks the way to play and says which kind of pack it has; `cards` is the turn's length, as `questions` is Trivia Night's.

### How to verify

`pnpm test src/games/pairs/config.test.ts`.

---

## Step 4: The flip card

**What:** `src/sdk/interactions/FlipCard.tsx` and its test; the standard's §6 lists it.

**Why:** flash cards work because players try before they see the answer, then mark themselves honestly.

`flipped` is a prop, not the card's own state: the machine keeps it (a `reveal` phase), so a refresh in the middle of a card shows the same thing, as everywhere else in the app (ADR 0006).

### How to verify

`pnpm test src/sdk/interactions/flipcard.test.tsx`. Show the back before the flip, and the test fails.

---

## Step 5: Picking several tiles

**What:** `src/sdk/interactions/PickCard.tsx` and its tests; the standard's §6 lists it.

**Why:** match-up and odd-one-out are the same action: pick three tiles out of ten, then check.

- **Before Check:** picked tiles are filled; once three are picked, the others don't take taps. Check is on only then.
- **After Check:** a right pick is green with a tick, a wrong one red with a cross, and an answer players didn't pick is outlined in green and marked Missed. The rest fade. The card says "2 of 3 right".

Tiles use the same grid as Name Ten's board (ADR 0013): two columns sharing the height, never under 44px.

### How to verify

`pnpm test src/sdk/interactions/pickcard.test.tsx`: 2 tests. Let a fourth tile be picked, and the first fails.

---

## Step 6: One machine, three ways to play

**What:** `src/games/pairs/machine.ts` and its tests.

**Why:** the rules from ADR 0020, as phases.

| | In `turn` | In `reveal` | Points |
|---|---|---|---|
| Flip | `flip` → `reveal` | `knew` / `not_yet` → the next card, or the summary | 1 per Knew it |
| Match, odd | `pick` (on/off, at most 3), `check` → `reveal` | `continue` → the next set, or the summary | 1 per right tile |

Guards keep each event to its way of playing: `flip` only on a card, `pick` only on a set of tiles, `knew` only after the flip.

### Dealing

`dealRound` makes a round from the item the format just drew:

- **Flip:** the card, with a coin flip for which side shows first when `twoWay`.
- **Match:** two more items drawn from the pool, so prompts don't repeat; their three partners; seven more tiles from other items' partners, never written the same way as an answer.
- **Odd:** the drawn item's group, six more of its words, and three words from other groups.

Everything random goes through the machine's `rng`, so a refresh deals the same round.

### How to verify

`pnpm test src/games/pairs/machine.test.ts`: 10 tests. Count every pick as right, or swap odd-one-out's answers with the group's words, and a test fails.

---

## Step 7: The views

**What:** in `src/games/pairs/views/`: `TurnView.tsx` (a flip card or a set of tiles, for both phases), `SettingsView.tsx` (way to play, both ways, cards per turn; and the Free Play view, 10, 20 or 50 cards), and tests. The machine's turn record gets `revealed`: the card flipped, or the set checked.

**Why:** a view gets the context but not the phase, so whatever the screen shows has to be in the context. `revealed` is set by `flip` and `check` and cleared by each deal.

As in Trivia Night, the clock is hidden on the result of the turn's last round, so time running out doesn't cut it short.

### How to verify

`pnpm test src/games/pairs`: 19 tests. Never show the card flipped, and the flip view test fails.

---

## Step 8: The game, its variants, registered

**What:** `src/games/pairs/index.ts` (with `config.freePlay`), `rules.md`, `README.md`, three variants (French Flash Cards, French Match-Up, L'intrus, all with Free Play), the registry, the `layers` icon, and tests: the definition, the variants, the home page, and L'intrus played alone through the real app.

**Why:** each way to play is a variant, so the home page offers all three, and "Make your own" opens Pairs' full setup.

### How to verify

`pnpm test`: 489 tests. `pnpm dev --host`, and play each of the three on a phone.

---

## Step 9: Docs

**What:** the standard's §1, §7 and §8 (Pairs as the fifth v1 game, with its item and primitives); README's status and games table; CONTRIBUTING points vocabulary lists at Pairs.

### How to verify

Read Pairs' README as someone adding a vocabulary pack.

---

## Chapter summary

| Step | What | SDK change? |
|---|---|---|
| 1 | ADR 0020: Pairs | |
| 2 | Pairs, and two French packs | |
| 3 | Settings | |
| 4 | The flip card | Yes: `FlipCard` |
| 5 | Picking several tiles | Yes: `PickCard` |
| 6 | One machine, three ways to play | |
| 7 | The views | |
| 8 | The game, three variants, registered | |
| 9 | Docs | |

**What we learned:**

- With variants and Free Play in place, a game built around them is mostly content: three ways to play, three variant files, two packs.
- A content rule can be about a whole pack, not one item: "no English meaning twice" and "seven words a theme". They're checked by the game's content tests, and written in its README.
- A view only sees the context, so anything on screen (a flipped card) has to be in it, even when the phase already says so.

**Tests:** 489 runtime tests and 31 compile-time checks.
