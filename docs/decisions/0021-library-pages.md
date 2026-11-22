# 0021. Library pages: home, browse, custom, categories and images

- **Status:** Accepted
- **Date:** 2026-11-22

## Context

The home page is one long list: every variant, then every base game ("Make your own"). With seven variants it already scrolls for a while, and the library will grow. Players need a short way in (a couple of games to start with), a way to find a game by what it's like (a party game, something to learn French with), and the custom setup out of the way of people who just want to play.

The cards are text only, in a single column. Pictures make a game recognisable at a glance and make the page feel like a games shelf, but no game has a picture yet, and most contributors won't make one.

## Decision

### Three pages

| Address | Page |
|---|---|
| `/` | Home: the saved game to continue, two **featured** variants, and two big links, **Browse games** and **Custom game** |
| `/games` | Browse: every variant in a two-column grid, with a filter by category. The chosen category is in the address (`/games?category=french`), so going back from a setup returns to it |
| `/custom` | Custom game: every base game in the same grid, each opening the setup with every setting (what "Make your own" was) |

`games` and `custom` can't be game ids: the route `/:gameId` would match them too. `defineGame` refuses them, as it refuses `play` and `rules` as variant ids.

A setup page's back link goes where the player came from: the card passes it along. Opened by its address, a variant's setup goes back to Browse and a game's own setup to Custom game.

### Featured

The two featured variants are a list in the app (`src/app/library/featured.ts`), not a `featured: true` in variant files: otherwise any pull request could feature its own variant, and nothing would keep it to two. A test checks that both exist.

### Categories

Each variant file lists its categories, at least one:

```json
"categories": ["party", "naija", "school"]
```

The list of categories is one file, `src/sdk/content/categories.json` (id and label, in the order the filter shows them). A variant may only use categories from it, so "naija" and "nigerian" can't both appear; the variant JSON Schema lists them, so editors suggest them. Adding a category is adding a line to that file and regenerating the schemas: no TypeScript.

The field is `categories`, not `tags`: a variant's `tags` already means "only play items with these tags" (ADR 0018). Reusing the name would change what existing variants deal.

### Images

By file name, not by a field:

- `src/games/<game>/images/game.webp`: the game's picture, used by its own card and by any variant without one.
- `src/games/<game>/images/<variant-id>.webp`: a variant's own picture.

WebP, AVIF, PNG or JPEG. The registry loads them with Vite (`import.meta.glob`), so each is served under a hashed name that browsers can keep. A test fails for an image named after nothing (a typo), or two images with the same name.

With no picture, a card shows a gradient in the theme's colors with the game's icon. It's what every card shows until real pictures are added, and it follows the theme, which a picture can't.

**Rejected:** a default picture per category. The three Back to School variants share their categories, so they'd all show the same picture; the base game tells them apart.

## Consequences

- **Easier:** a new variant appears in Browse under its categories with no code; a picture is a file dropped in a folder.
- **Harder:** one more page between home and most games (Browse). The featured two and Continue keep the common case one tap away.
- **SDK change:** variant files get `categories` (required). Every existing variant gets its categories in this chapter.
