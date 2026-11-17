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
