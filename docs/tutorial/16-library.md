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
