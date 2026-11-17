# 09 — Theme parts

**Goal of this chapter:** themes can feel like a place, not only a palette: sticky notes on lined paper, glass panels over a moving starfield, a chalkboard. A theme still holds no code: it picks looks from a menu of parts that we build and test.

**Branch:** `chapter/09-theme-parts`

**Where this fits.** Chapter 08 made a theme a file of values. This chapter adds a second kind of choice: named looks for cards, buttons, the page background, decorations and icons.

---

## Step 1: Deciding what a part is

**What:** [ADR 0011](../decisions/0011-theme-parts.md). No code yet.

**Why:** textures, decorations and animation are CSS, and CSS can break a layout or tire players' eyes. We need rules that keep a theme to paint, before the first part is written.

### A menu, not CSS

A theme says `"surface": "paper"`; the CSS for `paper` is ours, in `src/app/theme/parts.css`. A designer chooses; a developer adds options.

### Paint only

A part can change colors, textures, shadows and tilt. It can't change size, spacing or position, so it can't push a button off a 360px screen or under 44px. A test reads the CSS and enforces it.

### Calm and readable

Backgrounds stay faint, glass cards get an extra contrast check, and every animation stops when the phone asks for reduced motion.

### How to verify

Read the ADR. Steps 2 to 6 build the menu; steps 7 to 10 use it.

---

## Step 2: How parts reach the page

**What:**

- `parts` in the theme schema, with one option per part for now: the plain look.
- `applyTheme` writes the picks as attributes on `<html>`, plus `--icon-stroke`.
- `Button` marks its variant; the flash card and dialogs are marked `data-feature`.
- `src/app/theme/parts.css`, imported by `index.css`, starting with the icon rule.
- `paintOnly.ts` and its test.

**Why:** the mechanism and its guard come before any look. The menu grows step by step: steps 3 to 6 each add options to `themeParts` together with their CSS, and test 336 fails if an option has no CSS.

### Attributes on `<html>`

```html
<html data-theme="sticky-notes" data-surface="sticky-note" data-button="sticker" …>
```

CSS then styles by them: `[data-surface='paper'] .bg-card:not(input) { … }`. Cards are found by their `bg-card` class, so a card added later gets the theme's surface without anyone remembering to add it. The rules aren't in a Tailwind layer, so they win over utility classes.

### The saved look includes the attributes

Chapter 08's script in `index.html` put back the style text before the first paint. Now it puts back the attributes too, from one saved JSON value (`ku-zo-wasa:theme-look`). The old key is removed when a theme is next applied.

### Icons

Every lucide icon has the class `lucide`. One rule, `.lucide { stroke-width: var(--icon-stroke); }`, sets every icon's line weight; CSS wins over the icon's own `stroke-width` attribute.

### Checking paint only

`paintOnly.ts` is a small reader for the CSS we write (rules, `@media`, `@keyframes`, comments). For each declaration it checks:

- On an element: no size, spacing, flow, font size, border width or position (except `position: relative`, which moves nothing).
- On a `::before` or `::after`: it must be `position: absolute` or `fixed`, and `pointer-events: none`. Then it may size and place itself, because it takes no space and catches no taps.
- `animation` and `transition` only inside `@media (prefers-reduced-motion: no-preference)`.
- Keyframes only move `transform`, `opacity` or `background-position`.

Test 334 feeds it a file breaking each rule, so we know the check on `parts.css` (test 335) can fail.

### How to verify

`pnpm test src/app/theme src/sdk/theme src/ui`: tests 333–338. Nothing changes on screen: every theme is still plain.

---

## Step 3: Surfaces

**What:** four looks for cards and dialogs in `parts.css`: `paper`, `sticky-note`, `glass` and `chalkboard`, added to the schema's menu. Glass cards get an extra contrast pair.

**Why:** cards are where most of a theme's character shows: the flash card, the game cards, the pack and mode choices, the dialogs.

### The looks

| Surface | How it's drawn |
|---|---|
| `paper` | A fine grain, and the bottom edge a shade darker |
| `sticky-note` | A darker sticky strip across the top, and a slight tilt that alternates down a list |
| `glass` | The card color at 72%, the page blurred behind it (`backdrop-filter`), a sheen across the top and a thin bright rim |
| `chalkboard` | Chalk dust over the board, inside a 5px frame in the theme's border color |

Every color comes from the theme's tokens, mixed with `color-mix(in oklch, …)`, so each look suits any palette.

### Three rules that shaped the CSS

1. **Tilt with `rotate`, not `transform`.** In Tailwind 4, `active:scale-[0.98]` (the press effect on game cards) sets the separate `scale` property. `rotate` adds to it; a `transform` would have replaced it.
2. **Never set `box-shadow` on a surface.** Shadows come from the theme's `shadow` token, and the review list's unlocked rows draw their ring with box-shadow. Setting it here would have erased both.
3. **Edges as `outline`, but not while focused.** An outline takes no space, so it can draw a frame. But keyboard focus is also an outline, so frames use `:not(:focus-visible)` and the focus ring always shows.

### Textures without image files

`--grain-dark` and `--grain-light` are tiny SVGs written into the CSS as data URLs. `feTurbulence` makes noise and `feColorMatrix` turns it into one color at 7–9% opacity: grain for paper, dust for chalk. They're ours, under the MIT license, so there are no image licenses to track.

### Glass and contrast

A glass card shows the page through it, so the text on it has to read against the page too. When a theme picks `glass`, `checkContrast` adds `card-foreground` on `background` (test 339).

### How to verify

- `pnpm test src/sdk/theme src/app/theme`: tests 335, 336 and 339.
- No theme uses these yet: step 7 dresses Sticky Notes.

---

## Step 4: Buttons

**What:** four looks for buttons in `parts.css`: `chunky`, `sticker`, `glass` and `chalk`, added to the schema's menu.

**Why:** buttons are what players touch most. A look that matches the cards makes a theme feel whole.

### Filled, outline and ghost

Rules pick buttons by the `data-variant` that step 2 added:

- **Filled** (primary, secondary, success, destructive) get the full look. The selector is `button[data-variant]:not([data-variant='outline'], [data-variant='ghost'])`.
- **Outline** buttons get small touches only, and never a `box-shadow`, because they already carry the theme's shadow (chapter 08's fix).
- **Ghost** buttons are icons (the theme palette, remove a team), and stay plain.

### The looks

| Button | Filled | Outline |
|---|---|---|
| `chunky` | A darker lip along the bottom; pressed, it sinks 2px (`translate`) and the lip shrinks | — |
| `sticker` | A 3px rim in the card color, the theme's shadow, tilted 1° | The same rim |
| `glass` | A sheen across the top half and a bright inner rim | The page behind is blurred |
| `chalk` | Chalk dust over the color | A dashed outline, like broken chalk lines |

**Highlights stay faint.** A white sheen over a button lightens its color a little where the label sits. Keeping highlights at 12% or less keeps the label's contrast close to what the theme check measured on the solid color.

**Rims are outlines.** As with surfaces, they're switched off while the button shows keyboard focus, so the focus ring always shows.

### How to verify

`pnpm test src/app/theme`: test 336 now requires CSS for every button look, and test 335 checks it only paints (`translate` and `rotate` move nothing else on the page).

---

## Step 5: Backgrounds

**What:** four page backgrounds in `parts.css`: `lined-paper`, `dot-grid`, `chalk-dust` and `starfield` (moving), added to the schema's menu.

**Why:** the page is the largest thing on screen. A background is what makes a theme feel like a place.

### A layer behind everything

Each background is `body::before`: `position: fixed; inset: 0; z-index: -1; pointer-events: none`. It covers the screen behind the content, never scrolls, takes no space and never catches a tap. The theme's page color (and gradient, if it has one) still sits under it.

### Faint, because text sits on the page

Most of our text is straight on the page: headings, hints, team names on the handoff screen. So every pattern is thin lines, small dots or soft smudges, in the theme's own colors at 5–16% (stars are brighter, but tiny and far apart). Contrast is still measured against the theme's `background`, the color between the marks.

### The starfield moves cheaply

The obvious way to move stars is to animate `background-position`, but that makes the phone repaint the whole screen 60 times a second. Instead:

- The layer starts 320px above the screen (`inset: -320px 0 0`), and the animation moves it down 320px with `transform`, which the phone's graphics chip handles without repainting.
- The three star tiles are 80, 160 and 320px, all of which divide 320. So when the animation jumps back to the start, every star is exactly where a star was: no seam.
- The `animation` is inside `@media (prefers-reduced-motion: no-preference)`, so phones set to reduce motion get still stars. Test 335 fails any animation outside it.

### How to verify

`pnpm test src/app/theme`: tests 335 and 336. Steps 7–10 put these on screen.

---

## Step 6: Decorations

**What:** four decorations in `parts.css`: `tape`, `pushpin`, `planets` and `chalk-smudge`, added to the schema's menu. The menu is now complete.

**Why:** a strip of tape on the flash card is a small thing, but it's what makes a theme feel made by hand.

### Only on feature elements

Decorations go on elements marked `data-feature`: the flash card and dialogs. Every card on screen getting tape (twenty pack choices, twenty strips) would be noise.

### Drawn with CSS

| Decoration | Drawn as |
|---|---|
| `tape` | A see-through strip, in the page color at 65% with paper grain, tilted 3° across the top |
| `pushpin` | A circle with a radial gradient (highlight, red, shade) and a drop shadow |
| `planets` | A shaded circle in the main color, and an ellipse with a border for the ring, tilted 18° |
| `chalk-smudge` | A soft rubbed-out patch, and a small rounded stick of chalk |

Each is a `::before` or `::after`: `position: absolute`, `pointer-events: none`. Test 335 enforces that, so a decoration can never take space or block a tap.

### Dialogs are different

A modal `<dialog>` is already fixed-positioned by the browser and clips anything that spills over its edge. So:

- The flash card gets `position: relative` (allowed: it moves nothing), and its tape or pin can hang over its top edge.
- On dialogs, decorations sit just inside the edge, within the 24px padding, so they never cover the title. The planet is also scaled to 70% (`scale`, paint only) and tucked into the corner.
- The chalk sits top-right everywhere, clear of a dialog's buttons at the bottom.

### How to verify

`pnpm test src/app/theme`: tests 335 and 336 cover every decoration. Steps 7–10 put them on screen.

---

## Step 7: Sticky Notes, dressed

**What:** a `parts` section in `src/themes/sticky-notes.json`. No code.

```json
"parts": {
  "surface": "sticky-note",
  "button": "sticker",
  "background": "lined-paper",
  "decoration": "tape",
  "icons": "bold"
}
```

**Why:** the first theme to use the menu, and proof that a theme pull request is still one JSON file.

What players see: the page is ruled paper with a margin line. Cards are notes with a sticky strip, tilted a little, alternating down a list. The flash card and dialogs are taped on. Filled buttons are stickers with a rim, and icons are drawn in heavier lines.

### How to verify

- `pnpm validate-content`: Sticky Notes passes.
- On a phone, pick Sticky Notes and go through setup, a turn, review and results.

---

## Step 8: Fonts for space and chalk

**What:** three more fonts on the list, all SIL Open Font License:

| Font | For | Latin file |
|---|---|---|
| Orbitron | Space Travel's headings: wide and futuristic | 12 KB |
| Exo 2 | Space Travel's text: clean, slightly technical | 41 KB |
| Gochi Hand | Chalkboard's headings: handwriting like chalk | 20 KB |

**Why:** a theme's headings carry most of its personality.

### A font we didn't take

The first pick for Chalkboard was Playpen Sans. Its Latin file is 196 KB, which a phone would download just to draw titles. Gochi Hand does the job in 20 KB. The comment on the font list now says to check the size before adding a font.

### Not every font comes in one variable file

Gochi Hand has a single weight, so it's in `@fontsource/gochi-hand`, not `@fontsource-variable/…`. The font test now reads both kinds of package, and `vite.config.ts` lets Vitest read both kinds of CSS. Bold headings in Gochi Hand are drawn bolder by the browser, which suits chalk.

### How to verify

`pnpm test src/app/theme`: tests 322 and 323 cover the new fonts. `pnpm build` lists their files in `dist/assets/`.

---

## Step 9: Space Travel

**What:** `src/themes/space-travel.json`, and a gap in the contrast check closed.

**Why:** a dark theme that uses the moving parts: the starfield, glass, planets.

### The design

| Choice | |
|---|---|
| `scheme` | dark |
| Colors | Deep navy page, cyan glow for the main color, violet secondary |
| `fonts` | Orbitron headings, Exo 2 text |
| `gradient` | Navy at the top fading to `muted` at the bottom, behind the stars |
| `parts` | Glass cards and buttons, a starfield, a ringed planet on the flash card and dialogs, thin icons |
| `shadow` | `flat`: black shadows don't show on navy anyway; the glass rims do the work |

### A gap the theme found

The first version faded the page to `secondary`. It passed the contrast check, but only because the check measured page text against `background`, the top of the gradient. At the bottom of the page, error text, outlines and text fields sit on `secondary`.

`checkContrast` now checks everything drawn on the page against each end of a gradient too. That found three problems: error text at 4.26 : 1, and button and text-field outlines at 2.9 : 1. Fading to the darker `muted` fixes all three without changing a color. Sunrise, Sunset and Sticky Notes have no gradient, so nothing changed for them.

### How to verify

- `pnpm validate-content`: Space Travel passes; test 340 covers the gradient pairs.
- On a phone, pick Space Travel. The stars drift slowly; with the phone set to reduce motion, they stay still.

---

## Step 10: Chalkboard

**What:** `src/themes/chalkboard.json`. No code.

**Why:** the third new theme, and a fit for the Back to School pack.

### The design

| Choice | |
|---|---|
| `scheme` | dark |
| Colors | A green-black board; white chalk for text; yellow, green and pink chalk for buttons; wood brown for outlines and frames |
| `fonts` | Gochi Hand headings, Nunito text |
| `parts` | Chalkboard cards (dust inside a wooden frame), chalk buttons (dusty fills, dashed outlines), chalk dust on the page, a smudge and a stub of chalk on the flash card and dialogs |
| `shadow`, `border` | `flat` (a board has no shadows) and `thick` (chalk lines are wide) |

The chalkboard surface draws its frame in the theme's `border` color, so here the wood brown does double duty: outlines of buttons and frames of cards. It passed the contrast check on the first run, outlines included.

### How to verify

- `pnpm validate-content`: Chalkboard passes.
- On a phone, pick Chalkboard: the flash card is a framed board with chalk in the corner.
