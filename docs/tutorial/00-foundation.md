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
