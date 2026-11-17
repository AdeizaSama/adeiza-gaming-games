# 0010. Theme files

- **Status:** Accepted
- **Date:** 2026-11-17

## Context

The Game Standard (§11) promised themes as JSON token files that designers add without code. Until now there has been one look, written into `src/app/index.css` as CSS variables: a light set of colors, a dark set that follows the phone's setting, a corner radius, a font and an animation speed. Components only use those variables (a test rejects Tailwind's built-in colors), so swapping the values swaps the look.

What has to be decided before theme files can exist:

- What a theme file holds, and how it's checked.
- How a file's values reach the page, with no build step per theme and no flash of the wrong colors when the app opens.
- How a designer who never runs the app finds out a theme is hard to read.
- Light and dark: a theme with two sets of colors, or one.

Constraints:

- **No code for theme contributors** (goal 2 of the project): a theme pull request is one JSON file.
- **Static site** (D3): no server, so nothing can be generated per request.
- **Readable at arm's length** (standard §12): a theme can make a game unplayable more easily than a content pack can.

## Decision

### A theme is one JSON file, with one scheme

`src/themes/<id>.json`, checked by a zod schema in `src/sdk/theme/`:

| Field | What it is |
|---|---|
| `id`, `name`, `description`, `contributors` | Like a pack's. The id is the file name. |
| `scheme` | `light` or `dark`: which one the theme is. |
| `colors` | Every color token (standard §11), as `#rrggbb` or `oklch(L C H)`. |
| `fonts` | `body` and `heading`, each an id from the font list below. |
| `radius` | Corner rounding in rem, 0–2. |
| `shadow` | `flat`, `soft` or `bold`. |
| `border` | `thin` or `thick`. |
| `gradient` | Optional: `{ "from": "<color token>", "to": "<color token>" }` for the page background. |
| `duration` | How long transitions take, in milliseconds, 0–400. |

**Every theme is light or dark, never both.** Picking a theme picks exactly what players see. It doesn't change when the phone switches to dark mode. Today's look becomes two themes, Sunrise (light) and Sunset (dark). A designer making a light and a dark version of an idea makes two themes.

We rejected themes with light and dark colors. Most themes are an idea before they are colors: a chalkboard is dark, sticky notes are light. A pair forces a designer to invent the other half, and players get a theme that changes under them.

### Fonts come from a list we bundle

A theme names fonts by id. The list lives in `src/sdk/theme/fonts.ts`:

- system font stacks, which cost nothing;
- open-licensed fonts (SIL Open Font License), installed from npm (`@fontsource-variable/…`) and served from our own site.

The browser downloads a font file only when text on the page uses it, so fonts no theme picks cost one small `@font-face` rule each. Adding a font is a code change, with its license checked once. Picking one is not.

We rejected links to a font service (Google Fonts). They break offline, send every visit to a third party, and let a theme name any font, with any license.

### The app applies a theme as CSS variables on `<html>`

Themes are bundled with the app (`import.meta.glob`). Applying one writes each token as a CSS variable on the `<html>` element, sets `color-scheme` (so scrollbars and form controls match) and the browser's `theme-color`. `index.css` keeps only the mapping from tokens to Tailwind classes, with no values of its own.

**No flash on open.** The app's script runs after the browser's first paint. So when a theme is applied, its variables are also saved on the device, and a few lines of script inside `index.html` put them back before the first paint. If nothing is saved yet (the first visit), the app picks Sunrise or Sunset by the phone's dark-mode setting, once, and saves that choice. From then on it changes only when a player picks another theme.

We rejected one CSS file per theme. CSS can do anything, so it can't be checked the way a schema checks JSON, and it puts code back into a theme pull request.

### Contrast is checked in CI

`pnpm validate-content` (already a CI check) checks every theme file against the schema, and checks the **contrast** of each color pair that's used for text or for the focus outline. It reports any pair under the minimum from the Web Content Accessibility Guidelines (WCAG 2.2, level AA):

- text pairs, such as `primary-foreground` on `primary`, must be at least **4.5 : 1**;
- the focus ring against the background must be at least **3 : 1**.

The message names the pair, its ratio and the minimum, so a designer can fix a theme without ever running the app.

## Consequences

- **Easier:** a theme pull request is one JSON file, checked for shape and readability before anyone reviews it.
- **Easier:** players get exactly the look they picked, in any light.
- **Harder:** a light and a dark version of an idea are two files. They're usually different ideas anyway.
- **Harder:** a new font needs a developer. Picking from the list doesn't.
- **Standard change:** §11 describes one scheme per theme and the new tokens; the Definition of Done's "light and dark" becomes "every shipped theme".
- **Not decided here:** looks beyond tokens (paper surfaces, animated backgrounds, decorations) are chapter 09's, in their own record.
