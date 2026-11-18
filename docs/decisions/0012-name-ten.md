# 0012. Name Ten: an answer board and a judge

- **Status:** Accepted
- **Date:** 2026-11-18

## Context

Name Ten is the second team-turns game (standard §8). A team gets a category, "Things found in a school bag", and has a minute to name ten things in it. Two questions decide how it plays on one phone:

- **How are answers counted?** The standard's v1 table planned a counter: someone taps +1 for each good answer. But "good" is then whatever the counter accepts, and every turn argues about it.
- **Who holds the phone?** In Charades the clue-giver holds it. In Name Ten the whole team is guessing, so nobody on it can be the one checking.

The games will need two pieces the SDK doesn't have: the screen for a turn (planned in standard §6 as `PromptCard`), and a handoff that says something other than "Pass the phone to".

## Decision

### An answer board

Each category comes with its answers, ten to twenty of them. When a turn starts, the game deals some of them onto a **board** (ten by default, a setting from 10 to 15), at random through the machine's random numbers, so a saved game deals the same board again. During the turn the judge taps each answer the team says. A turn scores **one point per answer on the board it got**.

An answer that's right but not on the board scores nothing. That's the cost of a board, and it's why content guidelines matter: a category must be one where the first ten or fifteen things people shout are the ones listed (Name Ten's README says how). We rejected a counter: it's simpler, but it turns every turn into an argument, and makes content (and its review) nearly meaningless.

A content item is therefore `{ category, answers[], tags }`, not `{ category, tags[] }` as the standard's table said.

### A judge from the next team

The board shows the answers, so the guessing team mustn't see it. The phone goes to a **judge from the next team** in playing order (the last team's judge is from the first team). The handoff screen says so: "Lions are up. Hand the phone to a judge from Eagles." The judge reads out the category, taps answers, and can end the turn early.

### Review before points count

When time runs out or the judge ends the turn, the turn goes to a review phase, like Charades (ADR 0007): the board's answers with Got it or Missed, locked until the host taps Adjust. A team that shouted an answer as the buzzer went can have it counted.

### SDK changes

- **`PromptCard`** (standard §6): a prompt (the category), a counter ("4 of 10"), and a list of answers that toggle when tapped. It knows nothing about Name Ten; Trivia Night or a later game can use it for any "tick what was said" board.
- **`Handoff` gets an optional `lead`**: the line above the name, "Pass the phone to" by default. Name Ten's handoff passes "Hand the phone to a judge from".
- **`Review` gets an optional `noun`**: its words said "cards". Name Ten reviews answers: "Tap an answer to change its result."

### Not in this version

The original design let a judge re-roll a category, or show an example answer, before the turn starts. Both need a screen between the handoff and the turn, which the team-turns format didn't have. Skipping a category came in the same chapter, with that format change ([ADR 0014](0014-a-phase-before-the-turn.md)); example answers are still left out.

## Consequences

- **Easier:** scoring is objective, and review fixes the rest. Content has a clear quality bar.
- **Harder:** writing a category means writing its answers, and checking that the obvious ones are all there.
- **SDK change:** `PromptCard` is built; `Handoff` takes `lead`; `Review` takes `noun`. The standard's §6 and §8 change to match.
