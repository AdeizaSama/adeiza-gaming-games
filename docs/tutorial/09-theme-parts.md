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
