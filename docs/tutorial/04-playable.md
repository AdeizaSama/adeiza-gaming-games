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

---

## Step 2: Screen tests

**What:** set up tests that draw React components and check what a player would see, with one small test of the current app page.

**Why:** from step 7 on, most of this chapter is screens. Machine tests prove the rules work; they can't prove that tapping "Got it" on the card actually sends `got`. Screen tests can. We set them up first, on a page that already exists, so the setup is proven before anything depends on it.

### What a DOM is, and why tests fake one

A browser turns HTML into a tree of objects (the **DOM**: Document Object Model) that code can read and change: `document.querySelector('h1')`, `button.click()`. React works by changing that tree. Our tests run in Node, which has no browser and so no `document`. Run a React render there and it fails with `document is not defined`.

**happy-dom** is a fake DOM written in JavaScript: enough of `document`, elements and events for React to render into, without opening a browser. It's fast, which matters when tests run on every save. It doesn't draw pixels, so it can't tell us whether something *looks* right; that's what the step 9 checkpoint on a real phone is for.

### What we installed

All dev dependencies: they're used by tests only and never reach players' phones.

| Package | What it's for |
|---|---|
| `happy-dom` | The fake DOM described above. |
| `@testing-library/react` | `render(<App />)` draws a component into the fake DOM; `screen` finds things in it. |
| `@testing-library/dom` | The finding part (`getByRole`, `getByText`). The React package needs it but doesn't install it itself. |
| `@testing-library/user-event` | Acts like a player: `user.click(button)`, `user.type(input, 'Lions')`. Used from step 7. |

**Why Testing Library:** it finds things the way a player does, by what's written on them and what they are (`getByRole('button', { name: 'Start' })`), not by CSS classes or component names. A test written that way keeps passing when the styling changes and fails when a player would notice something broken. Finding by role also checks accessibility for free: a button a screen reader can't recognise as a button can't be found.

### Only screen tests get the fake browser

Every machine and content test still runs in plain Node. A test file opts in with a comment on its very first line:

```ts
// @vitest-environment happy-dom
```

Why not give every test the fake browser? The SDK's tests prove that game logic needs no browser at all (standard §4). Running them without one keeps that true: if a guard or action ever touched `document`, its test would fail.

### `src/testSetup.ts` and `vite.config.ts`

```ts
afterEach(() => cleanup())
```

`cleanup()` removes whatever the last test rendered, so each test starts with an empty page. Testing Library does this by itself only when test functions like `afterEach` are global; ours are imported from `vitest`, so the setup file does it. `vite.config.ts` gains a `test` section that runs this file before every test file. The `/// <reference types="vitest/config" />` line at the top teaches TypeScript that the `test` section exists.

### Tests: `src/app/App.test.tsx`

One test: the current page shows "Ku Zo Wasa" as a heading and the subtitle. The page is replaced by the game library in step 10, and this test with it. The full table is in [docs/tests.md](../tests.md#app).

### Files changed

- `package.json`, `pnpm-lock.yaml`: the four dev dependencies.
- `vite.config.ts`: the `test.setupFiles` setting.
- `src/testSetup.ts`, `src/app/App.test.tsx` (new).
- `docs/tests.md`: screen tests explained; the new test; counts updated to 180.

### How to verify

1. `pnpm test` reports `180 passed`.
2. Delete the first line of `App.test.tsx` and run `pnpm test`. The test fails with `ReferenceError: document is not defined`: without the comment it runs in plain Node. Put the line back.
3. `pnpm typecheck` and `pnpm lint` pass.
