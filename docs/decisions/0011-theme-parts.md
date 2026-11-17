# 0011. Theme parts

- **Status:** Accepted
- **Date:** 2026-11-18

## Context

ADR 0010 made a theme a JSON file of values: colors, fonts, radius, shadow, outline weight, a gradient. That covers "the same app in different colors". It can't make a theme feel like sticky notes on a desk, a spaceship window or a school chalkboard. Those need textures, edges, decorations and moving backgrounds, which are CSS, and a theme file can't hold CSS without becoming code (ADR 0010 rejected CSS files for that reason).

Constraints:

- **No code in a theme pull request** (goal 2).
- **Nothing a theme picks may break the layout.** Every screen is laid out for a 360px-wide phone, and tap targets must stay at least 44px (standard §12).
- **Readable and calm.** A turn lasts a minute and players read the card at arm's length. Motion must stop for players whose phone asks for less of it.
- **No media licensing** (v1 non-goal): no image files.

## Decision

### A menu of parts, built in code, picked by name

A theme picks from a menu, under `parts` in its file:

| Part | Options | What it changes |
|---|---|---|
| `surface` | `plain`, `paper`, `sticky-note`, `glass`, `chalkboard` | Cards and dialogs: their fill, edges, texture and tilt |
| `button` | `solid`, `chunky`, `sticker`, `glass`, `chalk` | Buttons: fill, edges, and how they look when pressed |
| `background` | `flat`, `lined-paper`, `dot-grid`, `chalk-dust`, `starfield` | The page behind everything; `starfield` moves |
| `decoration` | `none`, `tape`, `pushpin`, `planets`, `chalk-smudge` | Small drawings on the flash card and on dialogs |
| `icons` | `thin`, `regular`, `bold` | The line weight of every icon |

Each option defaults to today's look, so existing themes don't change. A designer picks parts in JSON; a developer adds a new option in code, reviewed once.

The parts are CSS in `src/app/theme/parts.css`. The app sets the chosen options as attributes on `<html>` (`data-surface="paper"`), and the CSS styles what's inside by them:

- **a card is any element with `bg-card`** (not text fields), so a new card gets the theme's surface without asking;
- **buttons** are the `Button` component, which marks its variant (`data-variant="primary"`);
- **decorations** go only on elements marked `data-feature` (the flash card and dialogs), so a list of twenty packs doesn't get twenty pieces of tape;
- **backgrounds** are a fixed layer behind the page.

We rejected per-component theme props (`<Card look={theme.surface}>`): every component would need to know about themes, and a missed one would silently ignore them.

### Paint only, enforced by a test

A part may change how things look, never where they are or how big they are. A test reads `parts.css` and rejects:

- size, spacing and flow properties (`width`, `height`, `padding`, `margin`, `gap`, `display`, `font-size`, `line-height`, `border-width`, and the like), and `position` on the element itself;
- decorations that take space: a `::before` or `::after` must be `position: absolute` or `fixed`, and `pointer-events: none` so it never catches a tap;
- animations of anything but `transform`, `opacity` and `background-position`, which phones animate cheaply;
- any animation outside `@media (prefers-reduced-motion: no-preference)`.

Allowed: colors, gradients, `background-*`, `border-color` and `border-style` (the width comes from the theme's `border`), `box-shadow`, `outline-color`, `filter`, `backdrop-filter`, `opacity`, `transform` (a tilt doesn't move anything else), and `position: relative` so a card can hold its decorations.

### Text stays readable

Most of our text sits straight on the page, not on cards. So a background can't be busy:

- patterns are faint lines, small dots or soft smudges, drawn from the theme's own colors at low opacity;
- contrast is still measured against the theme's `background`, which is the color between the marks;
- `glass` cards let the page show through, so a theme with glass must also pass `card-foreground` on `background`. The contrast check adds that pair when it sees `glass`.

### Drawn by us

Every texture and decoration is CSS gradients or a small inline SVG in `parts.css`, under the project's MIT license. No image files, no licenses to track.

## Consequences

- **Easier:** a theme can feel like a place, not just a palette, and still be one JSON file.
- **Easier:** layout can't regress because of a theme: the test rejects it before review.
- **Harder:** a new look needs a developer, and each part is CSS someone has to look at on a phone; tests check rules, not taste.
- **Harder:** cards are found by their `bg-card` class. A card that uses another background won't get parts; that's the rule for new components (standard §11).
- **Standard change:** §11 gets the parts menu.
