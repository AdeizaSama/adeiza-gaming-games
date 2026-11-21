# 0020. Pairs: flip cards, match-up and odd-one-out

- **Status:** Accepted
- **Date:** 2026-11-21

## Context

Learners practise vocabulary with pairs: "le chat" and "cat". Three ways of playing with pairs make good games:

- **Flip cards:** see one side, think, flip, and say honestly whether you knew it.
- **Match-up:** three words at the top, ten tiles below: tap the three that are their partners. The other seven are partners of other words.
- **Odd-one-out:** a group ("les animaux") and ten words: tap the three that don't belong.

All three read the same kind of content (pairs), so they're one game with three ways to play, not three games. Which way a variant plays is a setting.

## Decision

### A pair

```json
{ "front": "le chat", "back": "cat", "tags": ["animals"] }
```

A pack is either **two-way**, where each side is a word with one partner (le chat ↔ cat), or **one-way**, where the back is a group many fronts share (le chat → les animaux). Flip cards work with both; match-up needs two-way (a group can't be a word's only partner); odd-one-out needs one-way (it's about groups). The settings say which: `twoWay`, and the variant sets it for its pack.

### Settings

- `play`: `flip`, `match` or `odd`.
- `twoWay`: when true, either side can be shown first, at random.
- `cards`: how many cards (flip) or sets of ten (match, odd) a turn, 1 to 50, default 10. A turn ends after them, or when time runs out.

### One machine, two phases

The game's own phases are `turn` and `reveal`, as in the choice turn (ADR 0015), with events by way of playing:

| Play | In `turn` | In `reveal` | Points |
|---|---|---|---|
| Flip | `flip` shows the back | `knew` or `not_yet`, then the next card | 1 per Knew it |
| Match, odd | `pick` a tile (on or off, at most 3), `check` | `continue` | 1 per right tile |

The deal draws from the format's pool itself, so prompts don't repeat: one card for flip, three prompts for match, and for odd one word whose group becomes the round's group. The other tiles come from all the items: other words' partners (match), or words from other groups (odd). A tile is never another answer written the same way, so a right pick is never marked wrong.

### New primitives

- `FlipCard`: one side, Show the answer, then both sides with Not yet and Knew it.
- `PickCard`: a prompt (a few words, or a group), tiles to pick a set number of, Check, and the result: right picks green, wrong red, and missed ones outlined.

### Free Play

Pairs offers Free Play (ADR 0019): 10, 20 or 50 cards, no clock.

### Content

French only, to start: **Français–anglais** (two-way: nouns with their article, so the gender is learnt with the word; nouns only, so every English meaning is one word's) and **Les thèmes** (one-way: the same nouns, with their theme). Three variants: French Flash Cards, French Match-Up, and L'intrus (odd-one-out).

## Consequences

- **Easier:** any vocabulary list becomes three games: a pack and a variant file.
- **Harder:** one game's views and machine handle three ways to play, so its tests cover each.
- **SDK change:** two primitives, `FlipCard` and `PickCard`.
