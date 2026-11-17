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
