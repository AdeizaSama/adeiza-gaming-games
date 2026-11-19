# This or That

One or the other, as fast as you can. A team gets a word and two answers, taps one, and finds out at once whether it was right. The first pack is for French learners: is the word masculine or feminine?

The full rules players see are in [rules.md](rules.md), on the game's How to play screen.

## Rules in short

- 2 to 10 teams, each playing one turn per round (2 to 20 players). The team playing holds the phone.
- **Two ways to play** (presets):
  - **Ten words** a turn, in 60 seconds (the default). Any number from 1 to 10 can be set.
  - **Against the clock:** as many as the team can answer in 60 seconds. Each result shows for 0.75 seconds, then the next word comes up by itself.
- One tap per word. The phone shows whether it was right, and the right answer if not.
- **1 point** per right answer (a setting, 1 to 5). A wrong answer costs nothing.
- The two options are shown A to Z (a setting), so they're in the same place for every word in a pack.

It plays Trivia Night's turn, the SDK's choice turn ([ADR 0017](../../../docs/decisions/0017-a-shared-choice-turn-and-this-or-that.md)), with exactly two options a question.

## Content guidelines

Packs are in [content/](content/), one JSON file each. [CONTRIBUTING.md](../../../CONTRIBUTING.md#1-add-or-improve-content-no-code) explains how to add or change one. A pack is one "this or that" question asked of many words: Masculin ou féminin ?, or Vrai ou faux, or Fruit or vegetable.

```json
{ "question": "chaise", "subtitle": "chair", "options": ["Masculin", "Féminin"], "answer": "Féminin", "tags": ["noun", "classroom"] }
```

**The one test that matters: does every word have exactly one right answer?** The app marks the tap, and nobody can overrule it.

1. **Leave out words where both answers are right.** In French: words that are the same in both genders (un or une élève, enfant, artiste; rouge, jeune, facile), and jobs whose feminine form people disagree on (médecin, professeur, pompier).
2. **Leave out words with two meanings that have different answers**, even with a subtitle: la poste (the post office) and le poste (a job).
3. **Never give the answer away in the question.** No article: "chaise", not "la chaise".
4. **Words with two forms are two questions:** acteur and actrice, petit and petite.
5. **Keep the answers close to half and half.** If most answers are the same, always tapping it wins. A test checks the Masculin ou féminin ? pack stays between 40% and 60%.

**Formatting:**

- Every question in a pack lists the same two options in the same order.
- `subtitle` is the meaning, in the players' language (at most 100 characters).
- Tag each word with what it is (`noun` or `adjective`) and, for nouns, its topic (`classroom`, `clothes`, `food`…), so players can filter.

## Files

| File | What it is |
|---|---|
| `index.ts` | The game's definition: meta, content, settings, presets, rules, machine, and the choice turn's views |
| `schema.ts` | What a content item is: the SDK's question fields, with exactly two options |
| `config.ts` | The settings: the SDK's choice turn settings, with This or That's defaults |
| `machine.ts` | The SDK's choice turn on This or That's questions |
| `rules.md` | How to play, for players |
| `content/` | The packs |
