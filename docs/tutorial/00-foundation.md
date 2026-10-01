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
