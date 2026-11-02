# 07 — Setup and rules

**Goal of this chapter:** players choose how to play Charades on the setup screen: a mode, points per result, a preset in one tap, and the rules to read first. Charades is then complete.

**Branch:** `chapter/07-setup-and-rules`

**Where this fits.** Chapter 06 gave Charades its modes and its scoring, but only tests could change them. This chapter puts them on the setup screen. It also adds presets (named groups of settings) and the game's rules.

---

## Step 1: Deciding how a game adds settings to setup

**What:** [ADR 0008](../decisions/0008-settings-and-presets.md). No code yet.

**Why:** the setup screen belongs to the app, and the app never imports a game. Charades' mode and points need a way onto that screen that the next games can use too. Presets were planned from the start but have never been shown. Both are contracts, so they're decided first.

### A settings view

A game gives `defineGame` an optional `config.view`. It's a component that gets the current settings and an `onChange` function, like a phase view gets `context` and `send`. The app shows it on setup, below the format's settings. How the settings look is up to the game.

### Presets are applied whole

A preset is the game's defaults plus its own changes. Tapping one sets every setting except teams, tags, and packs (unless the preset names some). A preset button is shown as selected only while the settings match it exactly. A preset no longer has to list packs: Quick, Classic and Party are about how to play, not what to play.

### How to verify

Read the ADR. Steps 2 to 4 build each section of its Decision in order.
