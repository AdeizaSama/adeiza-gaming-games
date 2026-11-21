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
