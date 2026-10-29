# 03 — Team-turns format

**Goal of this chapter:** build the team-turns format (standard §7): the outer loop that Charades, Name Ten and Trivia Night share, and `defineGame`, the function every game exports. Then build core Charades on top of it. The chapter ends when Charades plays a full game from start to finish in tests. No screens yet.

**Branch:** `chapter/03-team-turns-format`

**Where this fits.** Phase 1 of the roadmap (the SDK and Charades) is now split into five chapters, not four:

| Chapter | Scope | Ends with |
|---|---|---|
| 01: Machine runner | Rng, machine types, `defineMachine`, the runner | A test machine plays a full game in tests |
| 02: Content packs | The pack schema, loading packs, JSON Schemas, `validate-content` in CI, Charades' item schema and first pack | All five CI checks are real |
| **03: Team-turns format** (this one) | The format's config, item pool, guards, actions and phase loop; `defineGame`; core Charades | Core Charades plays start to finish in tests |
| 04: App shell | Game list, setup, play and results screens, interaction primitives, theme tokens, save and resume | Core Charades is playable on a phone |
| 05: Charades complete | Modes, double points for acting and singing, skip penalty, settings and presets, rules, the game's README | Charades meets the Definition of Done |

The old chapter 03 held the format *and* the whole app shell, with a placeholder game to try it on. That was too much for one pull request someone can actually review. Splitting it also removes the placeholder: Charades is the real game from this chapter on, built in two stages. Here it gets the core rules (a correct guess scores 1, a skip just moves on, the timer ends the turn). The extras wait for chapter 05.

**Why no screens yet.** Every screen shows one phase of a game (standard §5), so screens are built on top of the phases this chapter defines. Building them first would mean building against an API that's about to change.

---

## Step 1: Five chapters, and a PR checklist that matches CI

**What:**

1. Record the new five-chapter plan: this file, and a note in chapters 01 and 02, whose tables and "next" lines still describe four chapters.
2. Fix the pull request template's checklist so it lists every check CI runs.

**Why:** a tutorial that describes a plan we've dropped will mislead the next person who reads it. We don't rewrite old chapters, because they record what happened at the time. A short "Changed in chapter 03" note at the top keeps them accurate and keeps the history.

The PR template is a separate problem. Its checklist said "`pnpm lint`, `pnpm test` and `pnpm build` pass locally", but CI runs five checks: typecheck, lint, test, validate-content and build. A contributor who followed the checklist could still have their pull request fail on the two checks it didn't mention. The rule from now on: **every check that can fail CI is in the checklist**, and any step that adds or changes a CI check updates the template in the same commit.

`pnpm build` already includes the type check (`tsc -b && vite build`), but the checklist lists `pnpm typecheck` on its own anyway, because CI runs it as its own check and reports it separately.

### Files changed

- `docs/tutorial/03-team-turns-format.md` (new, this file).
- `docs/tutorial/01-machine-runner.md`: a note under the chapter table.
- `docs/tutorial/02-content-packs.md`: a note under the introduction and under "Chapter 02 done".
- `.github/pull_request_template.md`: the checklist names all five CI checks.
- `docs/game-standard.md` §12: the template's checklist must match the CI checks.

### How to verify

1. Open `.github/pull_request_template.md`. The first checklist line names `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm validate-content` and `pnpm build`. Compare it with the `run:` lines in `.github/workflows/ci.yml`: same five commands.
2. Open chapters 01 and 02. Each has a "Changed in chapter 03" note that links here.
3. No code changed: `pnpm test` still reports 118 passed.
