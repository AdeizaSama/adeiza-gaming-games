# 12 — This or That

**Goal of this chapter:** a fourth game, This or That: a quiz with two options a question. Its first pack is for French learners: "chaise: masculin or féminin?".

**Branch:** `chapter/12-this-or-that`

**Where this fits.** This or That plays exactly like Trivia Night. A game can't import another game, so the first step moves Trivia Night's turn into the SDK, where both use it. That's the shared multiple-choice template: the next quiz game is mostly content.

---

## Step 1: Deciding where the shared turn lives

**What:** [ADR 0017](../decisions/0017-a-shared-choice-turn-and-this-or-that.md). No code yet.

**Why:** This or That needed a home for rules it shares with Trivia Night. A preset of Trivia Night can't have its own name in the library or its own kind of question; a copy of Trivia Night's machine would drift apart from it.

| Lives in | What |
|---|---|
| `src/sdk/content/choices.ts` | A question's fields (`choiceFields`) and the option rules |
| `src/sdk/formats/team-turns/choice/` | Settings (`choiceConfig`), machine (`choiceTurns`), turn view, settings view |
| Each game | Its schema, defaults, presets, content, rules |

### How to verify

Read the ADR.
