# 08 — Theme files

**Goal of this chapter:** the look of the app comes from JSON theme files that a designer can add without writing code. Each file is checked for shape and for readable contrast, and players pick a theme on the library page.

**Branch:** `chapter/08-theme-files`

**Where this fits.** Since chapter 04, every color, the corner radius and the font have been CSS variables in `src/app/index.css`, and a test has kept components from using any other colors. This chapter moves those values into theme files. Chapter 09 adds looks that go beyond values: paper, glass, chalk, animated backgrounds.

---

## Step 1: Deciding what a theme file is

**What:** [ADR 0010](../decisions/0010-theme-files.md). No code yet.

**Why:** a theme file is a contract with designers, like a pack is with writers. What it can say, how it's checked and how it reaches the page all have to be settled before the first file is written.

### One scheme per theme

Until now the look had a light half and a dark half, and the phone chose. From now on, **a theme is light or dark**, and picking one picks exactly what players see. Today's look becomes two themes: **Sunrise** (light) and **Sunset** (dark).

### Values, not CSS

A theme file holds values: colors, font ids from a list, a radius, a shadow style, a border weight, an optional gradient, a speed. The app turns them into CSS variables. A file of values can be checked by a schema; a CSS file can't.

### Contrast in CI

A designer may never run the app. So the content check computes the contrast of every text color on its background, and fails a theme that would be hard to read, naming the pair and its ratio.

### How to verify

Read the ADR. Steps 2 to 7 build it in order.

---

## Step 2: The theme schema

**What:**

- `src/sdk/theme/`: `schema.ts` (the theme file format), `color.ts` (reading a color), `fonts.ts` (the fonts a theme can pick; system fonts for now) and `loadThemes.ts` (`checkTheme`, `loadThemes`).
- `pnpm validate-content` checks `src/themes/*.json`.
- `pnpm generate-schemas` writes `schemas/theme.schema.json`.

**Why:** the format comes first, and it gets the same treatment as packs: one check used by both the app and CI, a JSON Schema so editors help while you type, and messages written for people who don't code.

### What a theme file looks like

```json
{
  "$schema": "../../schemas/theme.schema.json",
  "id": "sunrise",
  "name": "Sunrise",
  "description": "Warm and bright.",
  "contributors": ["AdeizaSama"],
  "scheme": "light",
  "colors": { "background": "oklch(0.985 0.006 75)", "foreground": "#2b2118", "…": "every color token" },
  "fonts": { "body": "system-rounded", "heading": "system-rounded" },
  "radius": 1,
  "shadow": "soft",
  "border": "thin",
  "duration": 200
}
```

Only the identity fields, `scheme` and `colors` are required; everything after `colors` has a default.

### Two color formats, both readable by code

`#rrggbb` is what most design tools copy. `oklch(L C H)` is what our tokens have used since chapter 04: lightness, how colorful, and hue. `parseColor` reads both into numbers. Anything else (`orange`, `rgb(…)`, three-digit hex) is rejected, so step 3's contrast check can always work out every color.

### The same loader shape as packs

`checkTheme(file, data)` returns the theme or its problems; `loadThemes(files)` takes what `import.meta.glob` finds and throws one error listing everything. A theme's id must be its file name, like a pack's.

### How to verify

- `pnpm test src/sdk/theme scripts`: tests 303–312.
- `pnpm validate-content` now ends with a "Checking themes" section. It says "(no themes yet)": the first two arrive in step 4.

---

## Step 3: Checking contrast

**What:** `src/sdk/theme/contrast.ts`: `contrastRatio` and `checkContrast`. The content check runs it on every theme whose shape is right. The pull request template gets a Themes section.

**Why:** a designer can make a theme that looks lovely in a design tool and is unreadable on a phone at arm's length. The check turns "is this readable?" into a number, so CI can answer it.

### The math, in three steps

1. **Color to light.** Hex colors are gamma-encoded, so each channel is converted to linear light. An oklch color goes through OKLab to linear sRGB, using the same published matrices browsers use. A color outside what a screen can show is clipped to it, as a screen would.
2. **Light to luminance.** `0.2126 R + 0.7152 G + 0.0722 B`: green looks brightest to our eyes, blue darkest.
3. **Two luminances to a ratio.** `(lighter + 0.05) / (darker + 0.05)`, from 1 (the same color) to 21 (black on white).

Test 313 pins the math to known values: #777 on white is 4.48 : 1, and pure red is 5.25 : 1 against black, whether written as `#ff0000` or in oklch.

### Which pairs

`contrastPairs` lists every pair the app draws, found by searching the components for text classes: each `-foreground` on its color, muted text on the page, on cards and on muted panels, primary text such as links, error messages, the timer's warning color (large text: 3 : 1), and the focus ring (3 : 1).

### Today's light colors fail

Running the check on the colors from chapter 04 finds four problems in the light set:

| Pair | Ratio | Needs |
|---|---|---|
| white on primary (buttons) | 3.52 : 1 | 4.5 : 1 |
| white on success (Got it) | 3.60 : 1 | 4.5 : 1 |
| primary on the page (links) | 3.48 : 1 | 4.5 : 1 |
| warning on the page (the timer) | 1.95 : 1 | 3 : 1 |

The dark set passes. Step 4 fixes the light set by lowering lightness only, keeping each hue: the orange and green get a little deeper, and the warning amber turns burnt orange.

### How to verify

`pnpm test src/sdk/theme scripts`: tests 313–317. To see a message, give a theme in step 4 a pale `primary` and run `pnpm validate-content`.

---

## Step 4: Today's look as two themes

**What:**

- `src/themes/sunrise.json` (light) and `src/themes/sunset.json` (dark): the values that were in `index.css`.
- `src/sdk/theme/apply.ts`: `applyTheme`.
- `src/app/theme/themes.ts`: the shipped themes, `startingTheme` and `pickTheme`.
- A few lines of script in `index.html`.
- `index.css` loses its values and its dark-mode query.

**Why:** ADR 0010. The values move into files a designer can edit, and the app applies whichever file is picked.

### The light colors changed

Step 3 showed four light pairs failing. Sunrise fixes them by lowering lightness only:

| Token | Before | Sunrise |
|---|---|---|
| `primary`, `ring` | `oklch(0.64 0.19 42)` | `oklch(0.57 0.19 42)` |
| `success` | `oklch(0.6 0.15 150)` | `oklch(0.54 0.15 150)` |
| `warning` | `oklch(0.78 0.16 80)` | `oklch(0.66 0.16 65)` |
| `warning-foreground` | `oklch(0.25 0.04 60)` | `oklch(0.2 0.04 60)` |

The orange and green are a little deeper; the warning color is now burnt orange rather than yellow. Sunset is the old dark values, unchanged.

### Applying a theme

`applyTheme` writes every token as a variable in the `<html>` element's `style` attribute, with `color-scheme` (so the browser draws scrollbars and form controls to match) and a `theme-color` meta tag (the address bar color on phones). Setting the whole attribute at once means nothing from the previous theme is left behind.

### No flash on open

The app's JavaScript runs after the browser has painted the page once. Without help, that first paint has no colors at all. So `pickTheme` also saves the style text, and a few lines in `index.html`'s `<head>` put it back:

```html
<script>
  try {
    var style = localStorage.getItem('ku-zo-wasa:theme-style')
    if (style) document.documentElement.setAttribute('style', style)
  } catch (error) {}
</script>
```

It runs before anything is painted, because a plain `<script>` in the head blocks the page until it's done. It holds no theme data, only what the app saved, so it never needs updating when themes change.

### The first visit

With nothing saved, `startingTheme` reads the phone's dark-mode setting and picks Sunset or Sunrise. `main.tsx` then calls `pickTheme`, which saves the choice, so the phone's setting is never read again.

### How to verify

- `pnpm test src/app`: tests 181, 182 and 318–321.
- On a phone with dark mode on, open the site in a private tab: it opens in Sunset. Turn dark mode off and reload: it stays Sunset.

---

## Step 5: Bundled fonts

**What:**

- Two fonts installed from npm: `@fontsource-variable/caveat` (handwriting) and `@fontsource-variable/nunito` (rounded).
- Both are added to the font list in `src/sdk/theme/fonts.ts`.
- `src/app/theme/fonts.ts` imports them, and `main.tsx` imports that file.

**Why:** a theme gets most of its character from its fonts. ADR 0010 settled on a list we bundle rather than links to a font service. Sticky Notes (step 8) uses these two.

### Why Fontsource

Fontsource packages the open-licensed Google Fonts as npm packages. Vite copies their font files into the build, so they're served from our own site: no third party, and they work offline once loaded. The `-variable` packages hold every weight in one file.

### What a font costs

Importing a package adds `@font-face` rules, about 0.6 KB of CSS for both. Each rule names a file and the characters it covers (`unicode-range`), and the browser downloads a file only when text on the page needs those characters in that font. So:

- With Sunrise or Sunset (system fonts), no font file is ever downloaded.
- With a theme using Caveat and Nunito, the phone downloads their Latin files once (75 KB and 39 KB), then keeps them in its cache.

### Licenses, checked by a test

The test reads each font's own `metadata.json` and checks the font's license is the SIL Open Font License (`OFL-1.1`), which allows bundling. It also checks that our family name matches the one in the font's CSS (`"Caveat Variable"`, not `"Caveat"`). A wrong name doesn't error anywhere; the text just quietly shows in the fallback font.

Vitest normally skips CSS files, so `vite.config.ts` opts these in, as it does for `index.css`.

### How to verify

- `pnpm test src/app/theme`: tests 322–323.
- `pnpm build`, then look in `dist/assets/`: the `.woff2` files are there, separate from the JavaScript.

---

## Step 6: Fonts, shadows, outlines and gradients on screen

**What:**

- `themeVariables` writes the new tokens.
- `index.css` maps them to classes.
- The three places with a fixed `border-2` use `border-line`.
- The word on a flash card uses `font-heading`.

**Why:** step 2 put these tokens in the schema; now they change what players see. As with colors, components keep the classes they already had wherever possible, and the classes read theme variables.

### How each token reaches the page

| Token | Variable | Used through |
|---|---|---|
| `fonts.heading` | `--font-heading` | `h1`–`h5` in `index.css`, and a `font-heading` utility for the card word |
| `shadow` | `--elevation-sm`, `--elevation-lg` | Tailwind's `shadow-sm` and `shadow-lg`, redefined in `@theme` |
| `border` | `--line` | A `border-line` utility: 2px (thin) or 3px (thick) |
| `gradient` | `--page-gradient` | `background-image` on the body |

**Why new names for the variables.** Tailwind's `@theme` already has `--shadow-sm`. Writing `--shadow-sm: var(--shadow-sm)` would point the variable at itself, so the theme's values get their own names (`--elevation-sm`) and `@theme` points at them.

**Why a utility for borders.** Tailwind's `border-2` is a fixed 2px. `@utility border-line { border-width: var(--line); }` makes a class whose width the theme decides. A test now fails on any `border-<number>` class.

### Bold shadows

`bold` is a hard, offset shadow in the text color (`3px 3px 0 0 var(--foreground)`), like a sticker on a page. Because it uses `var(--foreground)`, it suits light and dark themes alike.

### How to verify

- `pnpm test src/app/theme.test.ts src/sdk/theme`: tests 324–328.
- Nothing changes on screen with Sunrise or Sunset: they use the defaults, which are today's values. Step 8's Sticky Notes is the first theme to change them.

---

## Step 7: The theme picker

**What:** `src/app/theme/ThemePicker.tsx`: a palette button in the library header that opens a "Theme" dialog with every theme.

**Why:** players need a way to choose. The library is where the app starts, and a dialog keeps it to one screen (no settings page).

### Previews in each theme's own colors

Each option shows a small swatch: the theme's page, a card with "Aa" in its heading font, and a dot of its main color. These use inline `style` with colors from the theme file. That's the one place a component shows colors that aren't the current theme's, and it doesn't break the no-raw-colors rule: that rule is about Tailwind's built-in palette, and these colors come from a checked theme file.

### Applied on tap

Choosing an option calls `pickTheme` straight away, so the whole page changes behind the dialog and players see the theme before they close it. There's no Save button, because nothing needs undoing: tapping the old theme puts it back.

### How to verify

- `pnpm test src/app/theme`: tests 329–330.
- On a phone, run `pnpm dev --host`. Tap the palette button, pick Sunset, then Sunrise; close and reload: the theme you picked stays.

---

## Step 8: Sticky Notes

**What:** `src/themes/sticky-notes.json`, the first theme that isn't today's look. One JSON file, no code: what a designer's pull request will look like.

**Why:** a theme that uses every token proves the format. Chapter 09 dresses it further with paper and tape.

### The design

| Token | Choice | Why |
|---|---|---|
| `scheme` | light | Paper is light |
| `background` | warm paper | The desk the notes are stuck on |
| `card` | sticky-note yellow | Cards, the flash card and dialogs are the notes |
| `foreground`, `primary` | ink blue | Written in ballpoint, with a blue marker for buttons |
| `secondary` | pink note | The other color of sticky note |
| `fonts` | Caveat headings, Nunito text | Handwritten titles and card words; text that stays easy to read |
| `radius` | 0.25 | Notes are nearly square |
| `shadow` | bold | A hard shadow, like a note lifting off the page |
| `border` | thick | Outlines drawn in marker |

It passed the contrast check on the first run. Had it not, `pnpm validate-content` would have named each pair and its ratio.

### How to verify

- `pnpm validate-content` lists `src/themes/sticky-notes.json` with a ✓.
- On a phone, pick Sticky Notes in the theme picker, then go through setup and a turn: handwritten headings, yellow cards with hard shadows, square-ish corners.
