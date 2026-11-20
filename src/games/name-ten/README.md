# Name Ten

Name ten before the clock runs out. A team gets a category, "Things Found in a School Bag", and shouts as many things in it as it can, while a judge from another team ticks them off a board of answers.

The full rules players see are in [rules.md](rules.md), on the game's How to play screen.

## Rules in short

- 2 to 10 teams, each playing one turn per round (2 to 20 players).
- The phone goes to a **judge from the next team**: the board shows the answers, so the team guessing mustn't see it.
- Before the clock starts, the team sees its category and can **skip** to the next one, up to three times a turn. A skipped category doesn't come back.
- A turn deals 10 of the category's answers onto the board (a setting, 10 to 15). The judge taps each one the team says, and can end the turn early.
- **1 point** per answer on the board the team said. A right answer that isn't on the board doesn't count.
- After each turn, the board is checked in review, where a missed or mistaken answer can be fixed before the points count.
- **Variant:** Name Ten (Back to School Edition): the Back to School pack, with rounds and turn length open. Settings players can open in a variant: `rounds`, `seconds`, `shown` (answers on the board).

## Content guidelines

Packs are in [content/](content/), one JSON file each. [CONTRIBUTING.md](../../../CONTRIBUTING.md#1-add-or-improve-content-no-code) explains how to add or change one.

```json
{ "category": "Things Found in a School Bag", "answers": ["Exercise Books", "Textbooks", "Bic Biro", "Pencil", "Eraser", "Ruler", "Mathematical Set", "Food Flask", "Handkerchief", "Provisions"], "tags": ["school"] }
```

**The one test that matters: will the first 10 to 15 things players shout be the answers on the board?** The judge can only tick what's on the board, so a team that names a right answer that isn't there scores nothing and feels cheated. Every rule below is a way of passing that test.

1. **Finite.** At most about 15 sensible answers. "Nigerian states" fails: there are 36, and the board holds 15 at most. "Secondary school subjects" passes: everyone names the same dozen.
2. **At least 10 answers.** The schema requires it. Never pad a short list with doubtful answers: widen the category to its real parent group, or pick another.
3. **Factual and clear.** Every answer must be defensibly in, and players must be able to tell from the category name whether their answer counts. The category name carries the limits ("of the 2000s", "Nigerian").
4. **A knowledge element.** "Colours" is too easy to be fun; "shades of red" costs you something.
5. **Popular, or niche enough that its fans nail it.** What fails is the middle: obscure answers inside a popular category.
6. **More than 15 only when every extra is obvious.** Up to 20 answers are allowed, but only if items 16 to 20 are things everyone says.

**Formatting:**

- Use the name people **say**: "Bic Biro", not "ballpoint pen". For a nickname, add the other form in brackets once: "Eid al-Fitr (Sallah)". Never list the same thing twice under two names.
- Put the obvious answers first. Answers are shuffled onto the board, but the order tells the next reviewer what you meant.
- Each answer is at most 50 characters, and no answer appears twice in a category (ignoring capitals and spaces).
- Tag each category with what kind it is (`school`, `food`, `tv`…), so players can filter.

## Files

| File | What it is |
|---|---|
| `index.ts` | The game's definition: meta, content, settings, rules, variants, machine and views |
| `variants/` | The ways to play it on the home page, one JSON file each |
| `schema.ts` | What a content item is: a category, its answers and tags |
| `config.ts` | The settings: the format's, plus how many answers go on the board |
| `machine.ts` | Choosing a category, dealing the board, ticking answers, review, and scoring |
| `rules.md` | How to play, for players |
| `views/` | The judge's handoff, the category, the board, review and the setting on setup |
| `content/` | The packs |
