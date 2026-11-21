# 14 — Free Play

**Goal of this chapter:** Masculin ou féminin ? and Back to School Trivia can be played alone: one player, at their own pace, a set number of questions, then a score. On a variant's setup, two tabs: Competitive and Free Play.

**Branch:** `chapter/14-free-play`

**Where this fits.** The team-turns format assumed a group. This chapter teaches it about one player, with two small settings, and lets each variant say whether it offers Free Play.

---

## Step 1: Deciding what Free Play is

**What:** [ADR 0019](../decisions/0019-free-play.md). No code yet.

| Decision | Why |
|---|---|
| Free Play is offered by a variant, if its game allows it | Charades and Name Ten need someone to guess or judge |
| One player, no hand-offs, no clock unless asked | Practice at your own pace |
| 10, 20 or 50 questions, then the score | Short enough to finish, long enough to learn |
| Two format settings: `solo` and `timer` | The rest of the format (pool, scoring, saving) already works for one player |

### How to verify

Read the ADR.

---

## Step 2: The format learns about one player

**What:**

- `config.ts`: two optional settings, `solo` and `timer`, and the teams rule moves onto the whole object: exactly one name with `solo`, at least two otherwise.
- `rules.ts`: `startTimer` sets no end when `timer` is false.
- `views/`: with `solo`, the hand-off sends `start` and the turn summary sends `next` by themselves; the results show "Your score".
- `choice/config.ts`: `safeExtend` instead of `extend`.

**Why:** the rest of the format (the pool, scoring, saving, Play again) already works for one player. Only the screens that assume a group need to step aside.

### Optional, not defaulted

`solo: z.boolean().optional()`, not `.default(false)`. Left out, a setting means how things were, so every existing game, test and saved game is valid as it is, and the settings type only grows two optional fields.

### A rule across two settings

"Exactly one team in Free Play" depends on two fields, so it's a `superRefine` on the object rather than a check on `teams`. That has a cost in zod: a game that *replaces* one of the format's fields (the choice turn sets its own `seconds` default) can no longer use `.extend()`, which refuses to override fields of a schema with such a rule. `.safeExtend()` does the same and keeps the rule. Games that only add fields (Charades, Name Ten) keep `.extend()`.

### Views that move on by themselves

The hand-off and the summary use the same pattern as the countdown: `useEffectEvent` for the send, and an effect that runs once when the view appears. The phases don't change, so a game resumed at the hand-off starts its turn again by itself.

### How to verify

`pnpm test`: 456 tests. Make the hand-off ignore `solo`, and the Free Play views test fails.
