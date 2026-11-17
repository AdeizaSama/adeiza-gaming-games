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
