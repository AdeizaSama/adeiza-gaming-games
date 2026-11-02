# Charades

Act it out. Beat the clock. Teams take turns: one player gives clues for the card on the phone, and their team calls out what's on it before time runs out.

The full rules players see are in [rules.md](rules.md), on the game's How to play screen.

## Rules in short

- 2 to 10 teams, each playing one turn per round (2 to 20 players).
- A turn: tap **Got it** for each card the team says, **Skip** to move on. When time runs out, the team checks every card in review and can fix a wrong tap before the points count.
- **Modes:** Describe (say anything but the words on the card), or Mix it up (each card says to describe it, act it out without words, or sing or hum it).
- **Points**, by default: 2 for a card described, 3 for a card acted or sung, −1 for a skip. A turn never scores below 0. Hosts can change all four in Advanced settings.
- **Presets:** Quick (2 rounds, 45-second turns), Classic (3 rounds, 60 seconds) and Party (Classic in Mix it up).

## Content guidelines

Packs are in [content/](content/), one JSON file each. [CONTRIBUTING.md](../../../CONTRIBUTING.md#1-add-or-improve-content-no-code) explains how to add or change one, step by step.

**Write for Describe first.** Most games are played in Describe mode, so every item must work when talked about. Add `modes` only when an item is also good to act or sing:

```json
{ "text": "Puff puff", "tags": ["snack"] }
{ "text": "Morning assembly", "tags": ["ritual"], "modes": ["describe", "act"] }
{ "text": "National Anthem", "tags": ["ritual"], "modes": ["describe", "act", "sing"] }
```

- `"act"`: you can show it without words, in a few seconds.
- `"sing"`: it's a song, jingle or chant people know the tune of.

A good item:

- **Is known by most people the pack is for.** If half the room has never heard of it, the clue-giver can only skip.
- **Is short:** a name, a thing or a phrase, at most 50 characters. One to four words is best.
- **Can be clued without saying it.** A word that's hard to talk around without saying a part of it makes a poor card.
- **Has tags** saying what kind of thing it is (`snack`, `subject`, `song`). Players use them to choose what to play.
- **Fits the pack's `maturity`**, and isn't about a private person.

## Files

| File | What it is |
|---|---|
| `index.ts` | The game's definition: meta, content, settings, presets, rules, machine and views |
| `schema.ts` | What a content item is |
| `config.ts` | The settings: the format's, plus mode and points |
| `machine.ts` | What happens in a turn and in review, and how a turn is scored |
| `rules.md` | How to play, for players |
| `views/` | The turn, review and settings screens |
| `content/` | The packs |
