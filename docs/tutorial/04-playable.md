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

---

## Step 3: Theme tokens

**What:** the default theme as CSS variables in `src/app/index.css`, light and dark, wired into Tailwind so classes like `bg-primary` use them. Tailwind's built-in colors are switched off, and a test fails if any file uses one.

**Why:** standard §11 promises that a theme is a JSON file and no code. That only works if every color on every screen comes from a token. Setting the rule before the first component is built is cheap; retrofitting it after twenty components isn't.

### Tokens, as variables

A CSS variable is a named value that other CSS can use: `--primary: oklch(0.64 0.19 42)` defines it, `var(--primary)` uses it. Change the definition and everything that uses it changes. That's what a theme is: a different set of definitions.

The names follow the ones shadcn/ui uses (step 4), so its components fit without renaming:

| Token | Used for |
|---|---|
| `background`, `foreground` | The page, and text on it |
| `card`, `card-foreground` | Raised surfaces such as the item card |
| `primary`, `primary-foreground` | The main action on a screen |
| `secondary`, `secondary-foreground` | Other actions |
| `muted`, `muted-foreground` | Quiet backgrounds, secondary text |
| `success`, `warning`, `destructive` (+ `-foreground`) | Got it, time running out, skip or quit |
| `border`, `input`, `ring` | Borders, form fields, the keyboard focus outline |
| `radius`, `font-body`, `duration` | Corner rounding, the font, animation speed |

Colors come in pairs, a background and the `-foreground` color for text on it, so a theme can't put dark text on a dark button by accident: whoever picks one picks both.

Colors are written as `oklch(lightness chroma hue)`. Unlike hex codes, its numbers mean something you can reason about: lightness 0 to 1, chroma (how colorful), and hue (the angle on the color wheel). The dark theme mostly flips lightness and keeps hues, so the two modes feel like the same app.

### Dark mode

```css
@media (prefers-color-scheme: dark) {
  :root { --background: oklch(0.18 0.012 50); … }
}
```

The phone's own light/dark setting decides. Only colors change; radius, font and speed stay the same. `color-scheme: light dark` on `<html>` also tells the browser to draw its own parts (scrollbars, form controls) to match.

### Wiring tokens into Tailwind

```css
@theme inline {
  --color-*: initial;
  --color-primary: var(--primary);
  …
}
```

Tailwind v4 makes a class for every `--color-<name>` it's told about: `--color-primary` gives `bg-primary`, `text-primary`, `border-primary` and so on. `inline` makes each class use `var(--primary)` itself instead of a copy of today's value, so switching to dark mode (or, later, another theme) changes every class.

`--color-*: initial` first deletes Tailwind's built-in palette. After it, `bg-red-500` produces no CSS at all. That's the enforcement: there's simply no raw color to reach for.

### A test that makes the silent failure loud

A deleted class doesn't cause an error; it just does nothing, which is easy to miss. `src/app/theme.test.ts` reads every `.ts`/`.tsx` file in `src/` as text and fails if any uses a built-in color name like `bg-red-500` or `text-white`, naming the file. Two more tests check that every color has a dark value and is wired into Tailwind.

The test reads files with Vite's `?raw` (give me this file's text) instead of Node's `fs`, because files in `src/` are type-checked for the browser, where `fs` doesn't exist. Vitest normally replaces CSS files with an empty string, so `vite.config.ts` tells it to load `index.css` for real.

### Files changed

- `src/app/index.css`: the tokens, dark mode, the Tailwind mapping and base styles.
- `src/app/App.tsx`: the subtitle uses `text-muted-foreground`.
- `src/app/theme.test.ts` (new).
- `vite.config.ts`: Vitest loads `index.css`.
- `docs/game-standard.md` §11: the token names.
- `docs/tests.md`: the new tests; counts updated to 183.

### How to verify

1. `pnpm test` reports `183 passed`.
2. In `App.tsx`, add `bg-blue-600` to the heading's `className` and run `pnpm test`. The theme test fails naming `/src/app/App.tsx: bg-blue-600`. Remove it.
3. Run `pnpm dev` and open the page. Switch the phone (or the computer) between light and dark mode: the background and text change. (`pnpm build` also passes.)

---

## Step 4: Button and Input

**What:** the first two UI components, in `src/ui/`: `Button` and `Input`, based on [shadcn/ui](https://ui.shadcn.com) and restyled onto the theme tokens, plus a small `cn` helper for combining class names.

**Why:** every screen from step 7 on needs buttons, and the setup screen needs text fields. Standard §9 says `src/ui/` holds only what's used, so it starts with exactly these two. ("Quit game?" needs a Dialog; it arrives with that feature in chapter 05.)

### What shadcn/ui is, and why it isn't installed

shadcn/ui isn't a package you install and import. It's a collection of component source files you copy into your project and then own: read, change, delete. That suits this repo: the code is ours, every line is visible, and nothing updates underneath us.

shadcn has a command-line tool that does the copying. We didn't use it, for two reasons:

1. **It rewrites `src/app/index.css`** with its own color variables, replacing the tokens from step 3.
2. **Its files import through path aliases** (`@/lib/utils`), which this repo doesn't use. Every import here is a relative path you can follow.

So the two components were copied by hand and trimmed to what we use. Without the tool there's no `components.json` (its settings file). Adding a component later is the same small job: copy it from the shadcn site, swap its color names for our tokens, and list it in the tutorial.

### Dependencies

shadcn's Button normally brings four packages. We kept one:

| Package | Kept? | Why |
|---|---|---|
| `tailwind-merge` | **Yes** (runtime, ~8 KB gzipped) | Resolves clashing classes so a caller's `className` wins over the component's (`bg-secondary` replaces `bg-primary` instead of both being applied, where whichever comes later in the CSS file wins, not whichever you wrote last). Hard to do correctly by hand. |
| `clsx` | No | Joins class names and drops empty ones. `tailwind-merge` already does both. |
| `class-variance-authority` | No | Builds variant classes. Two plain objects (`variants`, `sizes`) do the same here and are easier to read. |
| `@radix-ui/react-slot` | No | Lets a Button render as another element (`asChild`). Nothing needs it yet. |

lucide-react, the icon set chosen for this chapter, is added when the first icon is used (the library page, step 10), not before.

### `cn`

```ts
cn('bg-primary px-4', false, 'bg-secondary') // 'px-4 bg-secondary'
```

Components list their own classes first and the caller's `className` last, so a screen can make a button full-width (`className="w-full"`) without copying it.

### `Button`

- **Variants:** `primary`, `secondary`, `success`, `destructive`, `outline`, `ghost`. Each is token classes only, so step 3's test checks them like any other file.
- **Sizes:** `md` (48px tall), `lg` (64px), `icon` (48px square). Even the smallest beats standard §12's 44px minimum for thumbs.
- **`type="button"` by default.** A plain `<button>` inside a `<form>` submits the form when tapped. The setup screen is a form, and a "remove team" button that submits it would be a confusing bug.
- **Feedback:** it shrinks slightly while pressed (`active:scale-95`), unless the phone asks for reduced motion (`motion-reduce:`), as standard §12 requires.
- **Focus outline** in the `ring` color, shown only for keyboard focus (`focus-visible`), not on tap.

### `Input`

- **16px text** (`text-base`). Phones zoom the whole page into a text field with smaller text when it's tapped, which is disorienting mid-setup.
- `aria-invalid` turns its border `destructive`, so the setup screen (step 11) can mark a bad team name by setting one attribute.

### Tests: `src/ui/ui.test.tsx`

5 screen tests. They tap and type with `user-event` and find elements by role and label, the way step 2 described. The full table is in [docs/tests.md](../tests.md#ui-components).

### Files changed

- `package.json`, `pnpm-lock.yaml`: `tailwind-merge`.
- `src/ui/cn.ts`, `src/ui/button.tsx`, `src/ui/input.tsx`, `src/ui/ui.test.tsx` (new).
- `docs/tests.md`: the new tests; counts updated to 188.

### How to verify

1. `pnpm test` reports `188 passed`.
2. In `button.tsx`, change `type = 'button', className` to `type, className` and run `pnpm test`. "is a button that does not submit forms unless asked to" fails. Change it back.
3. `pnpm typecheck`, `pnpm lint` and `pnpm build` pass.
