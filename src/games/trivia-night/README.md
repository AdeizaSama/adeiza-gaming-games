# Trivia Night

Pick the right answer before the clock runs out. A team gets a question and a few answers to choose from, taps one, and finds out at once whether it was right.

The full rules players see are in [rules.md](rules.md), on the game's How to play screen.

## Rules in short

- 2 to 10 teams, each playing one turn per round (2 to 20 players). The team playing holds the phone: nothing on screen gives the answer away until they tap.
- **Three ways to play** (the `mode` and `questions` settings):
  - **One question** a turn, with 30 seconds for it (the default).
  - **A set number** a turn, 1 to 10, with the turn's time for all of them.
  - **Against the clock:** as many as the team can answer before time runs out. Each result shows for 0.75 seconds, then the next question comes up by itself.
- **Variants:**
  - **Back to School Trivia:** the Back to School pack, with rounds, turn length, mode and questions a turn open.
  - **Masculin ou féminin ?:** the French pack, ten words a 60-second turn, options A to Z, with rounds, turn length and words a turn open (always Set questions).
- Settings players can open in a variant: `rounds`, `seconds`, `mode`, `questions`, `points`, `order`.
- One tap per question. The phone shows whether it was right, and the right answer if not.
- **1 point** per right answer (a setting, 1 to 5). A wrong answer costs nothing.
- The options are shuffled every time, or shown A to Z (a setting).

## Content guidelines

Packs are in [content/](content/), one JSON file each: Back to School, and Masculin ou féminin ? (French words, two options each, the English meaning as the subtitle). [CONTRIBUTING.md](../../../CONTRIBUTING.md#1-add-or-improve-content-no-code) explains how to add or change one.

```json
{ "question": "What is 7 × 8?", "options": ["56", "54", "48", "64"], "answer": "56", "tags": ["maths"] }
```

**The one test that matters: could someone who knows the subject defend a different option?** The app marks the tap, and nobody can overrule it, so a question with two defensible answers marks a right team wrong in front of everyone. Every rule below is a way of passing that test.

1. **Exactly one defensible answer.** Watch for "the best", "the biggest", "one of the", "who uses X" when several do, and facts that differ between versions (the book and the film, the first series and the later ones). Before writing the options, say the sentence that rules out the nearest wrong one. If you can't, the question isn't finished.
2. **Nothing that goes out of date.** No "current", "latest", "most-watched", "highest-grossing": records move, and nobody re-checks a file. Settled history is fine: first, founded, won in 1996.
3. **Wrong options that are tempting but wrong.** All from the same family as the answer (four years, four singers), and none that could also be right.
4. **2 to 5 options.** Four is usual. Two is fine for true-or-false or this-or-that.

**Formatting:**

- `answer` is one of the `options`, written exactly the same way: same capitals, same spelling.
- `subtitle` is optional: a smaller line under the question, for a hint or a translation (at most 100 characters).
- The question is at most 150 characters; each option at most 80. No option twice (ignoring capitals and spaces).
- The order of the options doesn't matter: they're shuffled, or put A to Z, when the question comes up.
- Tag each question with its subject (`maths`, `science`, `social-studies`, `entertainment`, `general`), so players can filter.

## Files

| File | What it is |
|---|---|
| `index.ts` | The game's definition: meta, content, settings, rules, variants, machine, and the choice turn's views |
| `variants/` | The ways to play it on the home page, one JSON file each |
| `schema.ts` | What a content item is: a question, its options, the answer and tags, using the SDK's option rules |
| `config.ts` | The settings: the SDK's choice turn settings, with Trivia Night's defaults |
| `machine.ts` | The SDK's choice turn (`src/sdk/formats/team-turns/choice/`) on Trivia Night's questions |
| `rules.md` | How to play, for players |
| `content/` | The packs |
