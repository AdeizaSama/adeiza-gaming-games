# Pairs

Learn words in pairs, three ways: flip cards, match-up (find the partners of three words among ten tiles), and odd-one-out (find the three words that aren't in a group). Alone in Free Play, or in teams.

The full rules players see are in [rules.md](rules.md), on the game's How to play screen.

## Rules in short

- **Flip cards:** see one side, flip, and mark yourself: Knew it (1 point) or Not yet.
- **Match-up:** three words at the top, ten tiles below. Pick their three partners, then Check: 1 point per right tile.
- **Odd one out:** a group and ten words, seven in it. Pick the three that don't belong, then Check: 1 point per right tile.
- A turn is 10 cards, or 10 sets of tiles (a setting, 1 to 50). In teams, turns are timed; in Free Play there's no clock.
- **Variants:** French Flash Cards and French Match-Up (Français–anglais), and L'intrus (Les thèmes). All offer Free Play.
- Settings players can open in a variant: `rounds`, `seconds`, `play`, `twoWay`, `cards`.

## Content guidelines

Packs are in [content/](content/), one JSON file each. [CONTRIBUTING.md](../../../CONTRIBUTING.md#1-add-or-improve-content-no-code) explains how to add or change one.

```json
{ "front": "le chat", "back": "cat", "tags": ["animals"] }
```

A pack is one of two kinds, and its variants say which (`twoWay`):

- **Two-way, a word and its partner:** for flip cards and match-up. **No back may be used twice** ("small" for both petit and petite): match-up would mark a right tile wrong. A test checks the French pack.
- **One-way, a word and its group:** for flip cards and odd-one-out. **Every group needs at least seven words**, and the pack at least two groups, so a round has seven in and three out.

**Formatting:**

- Each side is at most 60 characters. Two pairs with the same front are the same pair.
- In French, give nouns their article ("le chat", "la chaise"), so the gender is learnt with the word. Before a vowel or a silent h it's "l'", which doesn't show the gender: Masculin ou féminin ? covers those.
- Tag each pair with its topic (`animals`, `food`…), so players can filter.

## Files

| File | What it is |
|---|---|
| `index.ts` | The game's definition: meta, content, settings, Free Play, rules, variants, machine and views |
| `schema.ts` | What a content item is: a front, a back, and tags |
| `config.ts` | The settings: the format's, plus the way to play, both ways, and cards a turn |
| `machine.ts` | Dealing a card or a set of tiles, flipping, picking and checking, and scoring |
| `rules.md` | How to play, for players |
| `views/` | The card or tiles, the settings and Free Play's length on setup |
| `variants/` | The ways to play it on the home page, one JSON file each |
| `content/` | The packs |
