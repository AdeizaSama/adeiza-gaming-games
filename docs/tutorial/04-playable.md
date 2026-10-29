# 04 — Playable

**Goal of this chapter:** make core Charades playable on a phone: open the site, pick Charades, name the teams, play every turn, see the results, play again. This is the first chapter with screens: UI tests, theme tokens, the first UI components, the shared interaction primitives, each phase's view, and the app's pages.

**Branch:** `chapter/04-playable`

**Where this fits.** Phase 1 of the roadmap (the SDK and Charades) is now six chapters:

| Chapter | Scope | Ends with |
|---|---|---|
| 01: Machine runner | Rng, machine types, `defineMachine`, the runner | A test machine plays a full game in tests |
| 02: Content packs | Pack schema, loading packs, JSON Schemas, `validate-content` in CI | All five CI checks are real |
| 03: Team-turns format | The format's settings, item pool, loop and `teamTurns`; `defineGame`; core Charades | Core Charades plays start to finish in tests |
| **04: Playable** (this one) | UI tests, theme tokens, Button and Input, views in `defineGame`, interaction primitives, game list, setup, play and results screens | Core Charades is playable on a phone |
| 05: Survives real life | Save and resume, refreshing mid-turn, the back button during a game, keeping the screen awake, "quit game?" | A refresh or a locked phone never loses a game |
| 06: Charades complete | Modes, double points for acting and singing, skip penalty, settings and presets, editable turn summary, rules, the game's README | Charades meets the Definition of Done |

The old chapter 04 ("app shell") held all of 04 and 05. Like the old chapter 03, it was too big to review properly, and it was mostly screens, which take longer to check than code with tests. Split, chapter 04 ends with something you can hold and play, and chapter 05 makes it robust.

**Until chapter 05, a refresh loses the game.** That's a known gap, not a bug: saving needs its own design (what's saved, how old saves are handled), and it gets a chapter.

---

## Step 1: Six chapters

**What:** record the new six-chapter plan: this file, and notes in chapter 03, whose table and "next" line still describe five.

**Why:** the same reason as chapter 03, step 1. Old chapters record what was planned at the time, so they aren't rewritten; a short "Changed in chapter 04" note keeps them accurate. Two code comments that said "chapter 05" for Charades' extras now say chapter 06.

### Files changed

- `docs/tutorial/04-playable.md` (new, this file).
- `docs/tutorial/03-team-turns-format.md`: notes under the chapter table and under "Chapter 03 done".
- `src/games/charades/index.ts`, `src/games/charades/machine.ts`, `src/sdk/game/defineGame.ts`: comments point at chapter 06.

### How to verify

1. Open chapter 03. Both notes link here.
2. Search `src/` for `chapter 05`: no results.
3. No behaviour changed: `pnpm test` still reports 179 passed.
