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
