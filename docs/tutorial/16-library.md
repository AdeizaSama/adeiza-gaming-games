# 16 — The library: home, browse and custom

**Goal of this chapter:** a home page that's quick to use (continue, two featured games, Browse and Custom), a Browse page with every variant in a two-column grid and a filter by category, a Custom game page for the base games, and a picture on every card.

**Branch:** `chapter/16-library`

**Where this fits.** Variants (chapter 13) made the home page a list of ways to play, and every chapter since added more. This chapter turns the list into a library. The next one adds sound and animation.

---

## Step 1: Deciding the pages, categories and pictures

**What:** [ADR 0021](../decisions/0021-library-pages.md). No code yet.

| Decision | Why |
|---|---|
| Home, Browse (`/games`) and Custom game (`/custom`) | The home page stays short; finding and customising get their own pages |
| Two featured variants, listed in the app | A flag in variant files would let any pull request feature itself |
| `categories` on variants, from one list | `tags` already means something on variants; one list keeps the names consistent |
| Pictures by file name, `game.webp` and `<variant-id>.webp` | Nothing to fill in; a variant without one shows its game's |
| A theme-colored gradient with the game's icon when there's no picture | Every card looks finished before any picture exists |

### How to verify

Read the ADR.

---

## Step 2: Categories

**What:**

- `src/sdk/content/categories.json`: the list, `{ id, label }` each, in the order Browse shows them: Party, Learning, Trivia, Words, Back to School, French, Naija.
- `src/sdk/content/categories.ts`: loads and checks it (kebab-case ids, each once, labels of at most 20 characters, since they go on buttons).
- Variant files get `categories`, required: at least one, each from the list, each once. Every variant has its categories now: the three Back to School variants are `party` and `school` (plus `naija`, `words` or `trivia`), the four French ones `learning`, `french` and `words`.
- `schemas/variant.schema.json`, regenerated: it lists the categories, so an editor suggests them.

**Why required:** a variant with no category would only show under "All" on Browse, where nobody filtering would find it.

The variant files changed in this step, not in a content step of their own: the app refuses a variant without categories, so the files and the rule have to land together.

### How to verify

`pnpm test src/sdk/content`: the new tests in `categories.test.ts` and `variant.test.ts`. Type `"categories": ["nigerian"]` in a variant file: the editor underlines it, and `pnpm validate-content` names the file and `categories.0`.
