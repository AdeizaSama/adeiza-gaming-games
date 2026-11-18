# 10 — Name Ten

**Goal of this chapter:** a second game, Name Ten: a team gets a category and a minute to name ten things in it, while a judge from another team ticks them off a board of answers.

**Branch:** `chapter/10-name-ten`

**Where this fits.** Charades built the SDK; Name Ten tests it. It's also a check on CONTRIBUTING: as we go, we note every point where the public docs didn't answer a question a contributor would have, and the chapter ends by writing the step-by-step guide CONTRIBUTING promised.

---

## Step 1: Deciding how Name Ten plays on one phone

**What:** [ADR 0012](../decisions/0012-name-ten.md). No code yet.

**Why:** two questions shape everything else: how answers are counted, and who holds the phone.

### An answer board

Each category comes with ten to twenty answers. A turn deals ten of them (a setting, 10–15) onto a board, and a point is an answer on the board that the team said. A counter (+1 for anything the judge accepts) would be simpler, but every turn would turn into an argument.

### A judge from the next team

The board shows the answers, so nobody on the guessing team can hold the phone. It goes to a judge from the next team in playing order.

### Reused, and new

Review after the turn is Charades' review, reused. New to the SDK: `PromptCard` (the board) and a `lead` line on `Handoff` ("Hand the phone to a judge from").

### How to verify

Read the ADR. Steps 2–7 build it; step 8 writes the docs.
