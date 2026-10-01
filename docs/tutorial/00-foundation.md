# 00 — Foundation

**Goal of this chapter:** go from an empty repo to an app that builds, with CI checks, lint-enforced folder boundaries, a license, contribution docs and the first decision record. No game code yet.

**Branch:** `chapter/00-foundation`

---

## Step 1: Write down the rules before the code

**What:** split the project's design notes into public documents that contributors can read:

- `docs/game-standard.md`: the contract every game, content pack and theme follows.
- `CONTRIBUTING.md`: how to contribute content, themes and games, and what a pull request needs.

We also trimmed `README.md` and fixed `.gitignore`.

**Why:** a library that other people extend needs its contract written down before the first line of code, and in one place. The README already had a long copy of the standard, so we had two sources that would drift apart. Now:

| File | Role |
|---|---|
| `docs/game-standard.md` | Canonical. All rules live here. |
| `CONTRIBUTING.md` | How to contribute. Links to the standard for rules. |
| `README.md` | Overview. Links to both. |

**`.gitignore` changes:**

| Pattern | Why |
|---|---|
| `node_modules/`, `dist/` | Installed packages and build output. Never committed. Added now so the scaffold in the next step doesn't create noise. |
| `.env*` | Replaces `*.env`, which matched `.env` but not `.env.local` or `.env.production`. The site needs no secrets, so any env file is a mistake. |

**Files changed:**

- `docs/game-standard.md` (new)
- `CONTRIBUTING.md` (new)
- `docs/tutorial/00-foundation.md` (new, this file)
- `README.md` (the standard and contributing sections are now summaries with links)
- `.gitignore`

**How to verify:**

1. Open `README.md` on GitHub (or in a Markdown preview) and follow the links to the standard and to CONTRIBUTING. Check that the anchor links in CONTRIBUTING (e.g. `#10-content-packs`) jump to the right section.
2. Check that nothing to be committed except `.gitignore` and the docs is listed: `git status`
3. Check the env pattern catches variants: `git check-ignore -v .env.local` should print the `.env*` rule (the file doesn't need to exist).

**Learned / decided:**

- The Game Standard is the single source for rules. README and CONTRIBUTING summarize and link.
- The standard says checks are "enforced by lint" and "required by CI" even though neither exists yet. A status note at the top of the standard says so; later steps in this chapter make it true.
- The public name changed from "Wasa Games" to **Ku Zo Wasa** (the old name was taken).
- Added contributor credit to the game definition: `meta.contributors` (the game) and `presets[].contributors` (each variant), both lists of GitHub handles. A preset example now shows the full variant shape: `id`, `name`, `contributors`, `config` overrides and `packs`.
- Content packs credit their writers with `contributors` too (renamed from `authors`), so there is one word for credit at every level.
- Added `schemas/` (generated JSON Schemas) to the repo layout. The content pack example already pointed there, but the layout didn't list it.

---

## Step 2: Scaffold the app with Vite

**What:** the smallest app that builds: Vite + React + TypeScript (strict), installed with pnpm. It renders the name and subtitle, nothing else. No styling, linting or tests yet; each of those gets its own step.

**Why:** decisions D6 (stack) and D7 (pnpm). Every later step needs a project that installs and builds.

**How we did it:** rather than running the generator in the repo and deleting half its output, we generated the official template somewhere else and copied in only what we need, so every file in the repo is one we chose:

```bash
npx create-vite@9.2.1 vite-ref --template react-ts
```

That gave Vite 8, React 19 and TypeScript 6.

**Kept from the template:**

| File | What it's for |
|---|---|
| `vite.config.ts` | Vite's config. For now it only adds the React plugin (JSX, fast refresh). Unchanged. |
| `tsconfig.json` | The root TypeScript config. It holds no settings itself; it points to the two below, so `tsc -b` checks both. Unchanged. |
| `tsconfig.app.json` | Settings for the code that runs in the browser (`src/`). We added `"strict": true`. |
| `tsconfig.node.json` | Settings for code that runs in Node (here just `vite.config.ts`). We added `"strict": true`. |
| `index.html` | The page Vite serves. It loads `src/main.tsx`. Title set to "Ku Zo Wasa"; the favicon link removed (no icon yet). |
| `src/main.tsx` | Entry point: mounts React into `<div id="root">`. Imports `App` from `src/app/` instead of `src/`, to match our repo layout. |
| `src/app/App.tsx` | The app shell (standard §9). Replaced the template's demo page with a heading and subtitle. |
| `package.json` | Renamed to `adeiza-gaming-games`. Added `"packageManager": "pnpm@10.20.0"` so tools (and Corepack) know which pnpm this repo uses (D7). |

**Why `strict` is set explicitly:** TypeScript 6 turns `strict` on by default (we checked: a bare config with no `strict` still rejects an implicit `any`), so the template leaves it out. We set it anyway so the rule (standard §12) is visible in the file, and doesn't depend on a default that someone reading the config has to know.

**Dropped from the template:**

| File | Why |
|---|---|
| `README.md` | We have our own. |
| `.oxlintrc.json` and the `oxlint` dependency | Linting is step 5, and it has to enforce our folder boundaries. We'll choose the linter there. |
| `src/App.css`, `src/index.css` | Styling comes with Tailwind in step 3. |
| `src/assets/*`, `public/*` | Vite and React logos, a demo image, an icon sprite. None of it is ours. |
| Template `.gitignore` | We merged its useful lines into ours (`*.log`, editor folders, `.DS_Store`). |

**Commands:**

```bash
pnpm install
```

```bash
pnpm build
```

`pnpm install` also creates `pnpm-lock.yaml`: the exact version of every package installed. It's committed so every machine and CI installs the same thing (D7: single lockfile).

**Files changed:**

- `package.json`, `pnpm-lock.yaml`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` (new)
- `src/main.tsx`, `src/app/App.tsx` (new)
- `.gitignore`
- `README.md` (the Development section now has the real setup commands)

**How to verify:**

1. `pnpm build` finishes with no errors and creates `dist/index.html` and a `dist/assets/index-*.js` file.
2. `pnpm dev`, then open the URL it prints. You should see "Ku Zo Wasa" and "Party games for one phone." on a plain white page.
3. Strict mode check: in `src/app/App.tsx`, add `function f(x) { return x }` and run `pnpm build`. It should fail with `TS7006: Parameter 'x' implicitly has an 'any' type` (plus an unused-function error). Remove the line afterwards.

**Learned / decided:**

- `pnpm build` runs `tsc -b` first, so a type error fails the build. CI gets type checking for free, though step 9 will also add a separate `typecheck` script so the failure is labelled clearly.
- TypeScript 7 (the native rewrite) is out, but the template pins TypeScript 6. We stay on 6 until the Vite tooling supports 7.

---

## Step 3: Add Tailwind CSS v4

**What:** install Tailwind and use a few of its classes on the page, to prove it works.

**Why:** decision D6 (stack). Tailwind v4 keeps its design values (colors, spacing, font sizes) in CSS variables, the same approach our themes will use (standard §11): a theme JSON file becomes a set of CSS variables, and components read the variables.

**What changed from Tailwind v3:** if you've used Tailwind before, v4 has no `tailwind.config.js` and no PostCSS setup. You add a Vite plugin and one line of CSS. Tailwind scans the source files itself to find which classes you used.

**Commands:**

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

Both are dev dependencies: Tailwind runs at build time and outputs plain CSS. Nothing from it ships to the browser except that CSS.

**Files changed:**

| File | Change |
|---|---|
| `vite.config.ts` | Added the `tailwindcss()` plugin next to `react()`. |
| `src/app/index.css` (new) | One line: `@import "tailwindcss";`. This brings in Tailwind's reset (called Preflight), its default design values and its utility classes. It lives in `src/app/` because global styles belong to the app shell. |
| `src/main.tsx` | Imports `./app/index.css` once, so the styles apply to the whole app. |
| `src/app/App.tsx` | Centers the heading and subtitle with Tailwind classes. |
| `package.json`, `pnpm-lock.yaml` | The two new packages. |

**About the classes on the page:**

- `min-h-dvh`: at least the full screen height. `dvh` ("dynamic viewport height") follows the visible area as a phone's address bar shows and hides; `vh` doesn't, which causes content to jump or be cut off on mobile.
- `flex flex-col items-center justify-center gap-2`: stack the children and center them.
- `p-4`: 16px padding, so text never touches the screen edge on a 360px phone.
- We deliberately used **no color classes**. Colors will come from theme variables (standard §11: "components use variables, never raw colors"). That's Phase 2, so this page stays black on white until then.

**How to verify:**

1. `pnpm build` now produces a `dist/assets/index-*.css` file (about 6 kB).
2. `pnpm dev`, then open the page: "Ku Zo Wasa" is large and bold, and both lines are centered in the middle of the screen. The browser's default margin around the page is gone (that's Preflight).
3. In the browser's dev tools, turn on a phone-sized view (360px wide). The text should stay centered with space on both sides.

**Learned / decided:**

- No shadcn/Radix components yet. D6 says "a minimal subset", so each component is added when a screen first needs it, not up front.

---

## Step 4: Add Vitest

**What:** install Vitest, add `test` scripts, and add one throwaway test that proves the runner works.

**Why:** decision D6 (Vitest), and standard §12: every machine needs a full-playthrough test plus a test for each guard and action. Tests are one of the five CI checks, so the runner has to exist before CI (step 9).

**Why Vitest:** it reuses `vite.config.ts`, so tests see the same TypeScript and import setup as the app with no separate config. It runs in Node by default, which is all our machine tests need: guards and actions are pure functions with no DOM (standard §4).

**Commands:**

```bash
pnpm add -D vitest
```

**Files changed:**

| File | Change |
|---|---|
| `package.json` | `"test": "vitest run"` runs every test once and exits (for CI and before committing). `"test:watch": "vitest"` re-runs tests as you save (for working locally). Plus the new dev dependency. |
| `src/app/smoke.test.ts` (new) | One test: `1 + 1` is `2`. It only proves the runner works. Delete it when the first real test lands (the Rng tests in chapter 1). |
| `pnpm-lock.yaml` | The new package. |
| `README.md` | Added `pnpm test` to the Development commands. |

**Conventions this sets:**

- Test files sit next to the code they test and end in `.test.ts` (e.g. `machine.ts` → `machine.test.ts`, standard §9). Vitest finds them on its own.
- Tests import `describe`, `it` and `expect` from `vitest` explicitly rather than using globals. That way each file shows where those names come from, and TypeScript needs no extra setup.
- No DOM testing setup (jsdom, Testing Library) yet. We add it when a view first needs a test, not before.

**How to verify:**

1. `pnpm test` reports `1 passed`.
2. Change `toBe(2)` to `toBe(3)` and run `pnpm test` again. It should fail with `expected 2 to be 3`. Change it back. (A test runner you've never seen fail hasn't been proven to work.)
3. `pnpm build` still passes, and `dist/` has no test code in it: tests are never imported by `main.tsx`, so Vite leaves them out.

**Learned / decided:**

- `tsc -b` type-checks test files too, because `tsconfig.app.json` includes all of `src/`. A type error in a test fails the build, the same as one in game code.

---

## Step 5: Lint, including folder boundaries

**What:** add ESLint with general TypeScript and React rules, plus rules that enforce which folders may import from which (standard §9).

**Why:** standard §12 makes lint one of the five CI checks. The boundary rules are what keep the project extendable: if a game could import another game, or the SDK could reach into a game, you could no longer add or remove a game without breaking others.

### Choosing the linter

The Vite template now ships **oxlint** (a very fast linter written in Rust) instead of ESLint. We tried oxlint first, using its `no-restricted-imports` rule for the boundaries, on a set of fake files. It caught every real violation, but it also flagged correct code: `games/charades/views/v.ts` importing `../../../sdk/x` was reported as "a game imports another game". That rule only looks at the import *text*, so the result depends on how deep the importing file is. It also needed a separate config block for every game, and couldn't express "app/ touches games only through the registry".

We chose **ESLint + `eslint-plugin-boundaries`**. That plugin follows each import to the real file, works out which folder (element) the file belongs to, and checks the pair against a list of allowed pairs. "Same game only" is one rule that covers every future game. Speed doesn't matter at this size.

No formatter (Prettier) for now: it isn't one of the CI checks. We'll add one if contributors' code styles start to differ.

### Packages

```bash
pnpm add -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-boundaries eslint-import-resolver-typescript
```

| Package | What it's for |
|---|---|
| `eslint` | The linter itself. |
| `@eslint/js` | ESLint's recommended rules for JavaScript (e.g. unreachable code, duplicate keys). |
| `typescript-eslint` | Lets ESLint read TypeScript, plus recommended TypeScript rules (e.g. no `any`). |
| `eslint-plugin-react-hooks` | Rules for React hooks: called in the same order every render, effects list their dependencies. |
| `eslint-plugin-boundaries` | The folder boundary rules. |
| `eslint-import-resolver-typescript` | Lets the boundaries plugin follow a TypeScript import to the file it really points at. |

pnpm 10 doesn't run packages' install scripts unless you allow them, and it warned about one: `unrs-resolver` (used by the import resolver). It ships prebuilt binaries and its script is only a fallback, so we listed it under `ignoredBuiltDependencies` in a new `pnpm-workspace.yaml`. That file holds pnpm settings; despite the name, this is not a monorepo (D9). Putting the setting in `package.json` under `"pnpm"` had no effect in pnpm 10.20.

### The config: `eslint.config.js`

ESLint reads a list of config blocks, applied in order:

1. `globalIgnores(['dist'])`: don't lint build output.
2. `js.configs.recommended`, `tseslint.configs.recommended`, `reactHooks.configs.flat.recommended`: the general rule sets.
3. The boundaries block, which has two parts.

**Elements:** each folder that matters gets a type. The first matching pattern wins.

| Type | Pattern |
|---|---|
| `registry` | `src/app/registry` |
| `app` | `src/app` |
| `sdk` | `src/sdk` |
| `ui` | `src/ui` |
| `game` | `src/games/*`, capturing the folder name as `gameId` |

**Policies:** `default: 'disallow'` makes any import between elements an error unless a policy allows it. The policies are the table in standard §9. "Same game only" is:

```js
allow: { to: { element: { type: 'game', captured: { gameId: '{{from.element.captured.gameId}}' } } } }
```

In words: a game may import a game only if the target's `gameId` equals the importer's `gameId`.

### Decided along the way

- **The registry is a folder, `src/app/registry/`, not a file.** The plugin's element patterns match folders; a file pattern needs a deprecated option. A folder also leaves room for the registry to grow.
- **`ui/` imports only `ui/`.** The standard didn't say. `ui/` holds the lowest-level components (button, dialog), so letting it import the SDK would let it depend on the code built on top of it. Added to standard §9.
- **npm packages are allowed everywhere.** The plugin's `default: 'disallow'` only applies between our own folders.

### Files changed

- `eslint.config.js` (new)
- `pnpm-workspace.yaml` (new)
- `package.json`: `"lint": "eslint ."` and the six packages; `pnpm-lock.yaml`
- `docs/game-standard.md` §9: the boundaries as a table, with the `ui/` rule and `app/registry/`
- `README.md`: `pnpm lint` in the Development commands

### How to verify

1. `pnpm lint` passes with no output.
2. Break a boundary on purpose. Create `src/sdk/probe.ts` containing `import App from '../app/App'` and `export default App`, then run `pnpm lint`. It should fail with `There is no policy allowing dependencies from elements of type "sdk" to elements of type "app"`. Delete the file.
3. Check the general rules: put `export const y: any = 1` in any `.ts` file under `src/`; `pnpm lint` should report `Unexpected any`. Remove it.

We ran a fuller check while building this step: temporary files importing in every direction produced exactly the six expected errors (app → game, game → other game, game → app, sdk → game, sdk → app, ui → sdk) and none for the allowed imports (same game, game → sdk/ui from a deep subfolder, app → registry → game, React).

The standard says "no `any` without a comment explaining why". The way to allow one is an inline disable with a reason after `--`:

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- third-party callback is untyped
```

---

## Steps 6–8: Licenses, templates and the first decision record

Three writing-only steps, done together.

### Step 6: License files

**What:** `LICENSE` (MIT, for code) and `LICENSE-CONTENT.md` (CC BY 4.0, for content packs).

**Why:** decision D8. A public repo with no license file is "all rights reserved" by default: nobody may legally reuse or contribute to it, whatever the README says.

- `LICENSE` is the standard MIT text, unchanged except the copyright line: `Copyright (c) 2026 Ku Zo Wasa contributors`. GitHub reads this file to show "MIT" on the repo page. We kept it as the exact MIT text, with nothing appended, so GitHub recognises it.
- `LICENSE-CONTENT.md` says which files are CC BY 4.0 (`src/games/*/content/*.json`), links to the official legal text, and shows how to credit a pack using its `contributors` field.
- The README's License section now links to both files.

### Step 7: Pull request and issue templates

**What:** a PR template and three issue forms in `.github/`.

**Why:** standard §12 and the Definition of Done are long. A checklist in every PR puts the relevant parts in front of the contributor at the moment it matters.

| File | Purpose |
|---|---|
| `.github/pull_request_template.md` | Pre-fills every PR: what and why, type of change, and checklists for content, games and SDK changes. Contributors delete the sections that don't apply. |
| `.github/ISSUE_TEMPLATE/bug-report.yml` | Game, what happened, steps, device. |
| `.github/ISSUE_TEMPLATE/game-proposal.yml` | Rules, format (with "None fits" as an option), a content item example, which primitives the turn uses. The standard says to open this before writing a game. |
| `.github/ISSUE_TEMPLATE/content-suggestion.yml` | For people who'd rather not edit JSON: game, pack, maturity, items, and how to credit them. |
| `.github/ISSUE_TEMPLATE/config.yml` | Keeps blank issues allowed, for anything that fits no form. |

The issue templates are **issue forms** (YAML): GitHub shows them as real form fields (inputs, dropdowns, checkboxes) rather than a block of Markdown to edit. That's friendlier for non-coders.

Links in the templates are absolute GitHub URLs: a relative link in a PR or issue body is resolved against the PR's page, not the repo, so it breaks.

### Step 8: ADR 0001, the Game Standard

**What:** `docs/decisions/0001-game-standard.md` and `docs/decisions/README.md`.

**Why:** standard §12 says changes to the SDK or the content pack format need a decision record. The standard itself is the first one, and it records the decisions made in this chapter: the contributor fields, the boundary rules, ESLint over oxlint, and the rename to Ku Zo Wasa.

- **The record** has four parts: status, context (the problem), decision (what we chose, including what we rejected and why), consequences (what gets easier and harder).
- **`docs/decisions/README.md`** lists the records and explains how to write the next one. Records aren't edited once accepted; a new record supersedes an old one.
- The standard's intro now links to the decisions folder.

### Files changed (steps 6–8)

- `LICENSE`, `LICENSE-CONTENT.md` (new)
- `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/*.yml` (new)
- `docs/decisions/0001-game-standard.md`, `docs/decisions/README.md` (new)
- `README.md` (License links), `docs/game-standard.md` (link to decisions)

### How to verify

1. After pushing, the GitHub repo page shows "MIT license" in the sidebar.
2. On GitHub, **Issues → New issue** shows three forms (Bug report, Game proposal, Content suggestion) plus a blank issue.
3. Opening a PR pre-fills the description with the template.
4. The issue forms add labels (`bug`, `game proposal`, `content`). GitHub only applies labels that already exist, so create `game proposal` and `content` under **Issues → Labels** (`bug` exists by default).
