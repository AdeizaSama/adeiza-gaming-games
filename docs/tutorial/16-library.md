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

---

## Step 3: Two game ids the library keeps

**What:** `defineGame` refuses `games` and `custom` as game ids (`reservedGameIds` in `src/sdk/game/defineGame.ts`), with a message naming the page that uses it.

**Why:** the next steps add `/games` (Browse) and `/custom` (Custom game). React Router prefers a fixed path like `/games` over `/:gameId`, so a game called `games` would never be reachable. Variants already have the same rule for `play` and `rules` (ADR 0018).

The routes come with their pages, in steps 6 and 7.

### How to verify

`pnpm test src/sdk/game/defineGame.test.ts`. Change Charades' `meta.id` to `custom` and run `pnpm test`: every test that loads the registry fails with `meta.id: "custom" is taken`.

---

## Step 4: The card, and its picture

**What:**

- `src/app/registry/images.ts`: `indexImages` sorts the picture files by game and name (`game`, or a variant's id) and lists any named after nothing; `cardImage` picks a variant's own picture, else its game's.
- `src/app/registry/index.ts`: `images`, every file in `src/games/*/images/`, loaded with `import.meta.glob(..., { query: '?url' })`. The registry already reads the games' folders; nothing else in the app may (standard §9).
- `src/app/library/GameCard.tsx`: the card. Picture on top (4:3 in the grid, 16:9 when featured), then the name (two lines at most in the grid), the tagline and a small line of detail. It passes its `back` link along to the page it opens.
- With no picture, `CardArt` draws the game's icon on a gradient of two theme colors. `standIn` picks the pair from the game's id, so a game looks the same everywhere and neighbours differ.

**Why `?url`:** it makes each picture a file with a hashed name that browsers can keep, and only the pictures a page shows download. Importing them as code would put every picture in the app's first download.

No page uses the card yet: the next three steps do.

### How to verify

`pnpm test src/app/library/cards.test.tsx`. Drop a file called `naija.webp` in `src/games/charades/images/`, and the test "has no picture in the games' folders named after nothing" names it.

---

## Step 5: Browse

**What:**

- `src/app/library/BrowsePage.tsx` at `/games`: every variant in a two-column grid of cards, and a row of filter buttons: All, then each category at least one variant is in.
- `src/app/library/LibraryLayout.tsx`: the frame Browse and Custom game share (a link home, a title, a line under it) and the grid.
- `src/app/setup/backLink.ts`: the setup page's back link now goes where the card said (`state.back`), or, opened by its address, to Browse for a variant.

**Why the filter is in the address:** `/games?category=french`. Open a game, tap back, and the filter is still French: the address is all the page needs. Picking a filter replaces the address instead of adding one, so the phone's Back goes home, not through every filter tried.

**Why the back link is checked:** navigation state comes from wherever the page was opened, and is gone after a refresh. `backLink` follows only a link inside the app (starting with `/`), and falls back otherwise.

The home page still has its long list; step 7 replaces it.

### How to verify

`pnpm test src/app/library/browse.test.tsx`. Run `pnpm dev`, open `/games`, tap French, open a game, tap Games at the top: French is still picked.

---

## Step 6: Custom game

**What:** `src/app/library/CustomPage.tsx` at `/custom`: every game in the same grid, each opening its own setup with every setting. A game's own setup, opened by its address, now goes back here.

**Why a page of its own:** most players want a ready-made way to play; the full setup (packs, tags, every setting) is for people who know what they want. On the home page it was a second list that pushed everything else down.

### How to verify

`pnpm test src/app/library/custom.test.tsx`. Open `/charades` directly: the back link at the top says Custom game.

---

## Step 7: The home page

**What:** `src/app/library/LibraryPage.tsx`, rewritten: the header and Theme, a saved game's Continue (unchanged), **Featured** (two wide cards), then two big links side by side, **Browse games** and **Custom game**. The long list of variants and "Make your own" are gone: they're Browse and Custom game now.

`src/app/library/featured.ts` lists the two: Naija Charades (Back to School Edition) and Back to School Trivia. A featured card's setup goes back home, not to Browse.

**Why the order:** Continue first, since it's what someone coming back wants; then two games that need no choosing; then the ways to look further.

The App tests that started on the home page and tapped a game in "Make your own" now start at `/custom` or `/games`; a new one checks the featured two exist, so renaming one fails a test instead of quietly emptying the home page.

### How to verify

`pnpm test src/app/App.test.tsx`. Run `pnpm dev`: the home page fits on a phone's screen, with Browse games and Custom game in reach of a thumb.

---

## Step 8: A lighter heading font for Space Travel

**What:** Space Grotesk (`@fontsource-variable/space-grotesk`, SIL Open Font License, 22 KB for Latin) added to `src/sdk/theme/fonts.ts` and imported in `src/app/theme/fonts.ts`; Space Travel's heading font changes from Orbitron to it. Orbitron stays in the list for any theme that wants it.

**Why:** Orbitron is wide, all one weight of square letters: on cards two columns wide, a name like "Naija Charades (Back to School Edition)" took four lines. Space Grotesk keeps a spacey, technical feel in about two thirds of the width.

Changing a theme's font is one line of its file: no code (goal 2). Adding a font to the list is code, as ADR 0010 says, and `fonts.test.ts` checks the new one is imported, named as its CSS says and OFL-licensed.

### How to verify

`pnpm test src/app/theme`. Run `pnpm dev`, pick Space Travel, open Browse: the names fit on two lines.
