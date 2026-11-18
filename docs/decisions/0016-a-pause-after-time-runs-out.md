# 0016. A pause after time runs out

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

When a turn's time runs out, the next screen appears by itself, under a finger that may be about to tap. A team picking a Trivia Night answer in the last second taps the turn summary's Next instead, and skips past its score. In Charades and Name Ten, the screen that appears is review: a late tap there hits Done, and the turn counts before anyone has checked it, or Adjust.

## Decision

The buttons on the two screens that can appear when time runs out are off for **2 seconds** after the screen shows:

- `Summary`: Next.
- `Review`: Adjust and Done.

They look disabled (the theme's faded button) for those 2 seconds, so players can see they aren't ready yet.

A hook in the SDK, `useSettled` (`src/sdk/interactions/useSettled.ts`), is false for the delay and then true. The delay is one setting, `settleDelay.ms`, so it's the same everywhere. Tests set it to 0 in `src/testSetup.ts`, because they tap through screens at once; the hook's own tests turn it back on, with a fake clock.

### Rejected

- **Only on screens that follow a time-out.** The summary also follows a tap (Done in review), where the pause isn't needed. Telling the two apart means the screen knowing how it was reached. A 2-second pause after a tap costs little, so every summary and review gets it.
- **Ignoring taps without showing it.** A button that looks ready but does nothing feels broken.
- **Shorter than a second.** Reaction time is under a second, so that would catch most late taps, but the maintainer asked for a few seconds. One setting changes it.

## Consequences

- **Easier:** a late tap no longer skips a score or counts a turn unchecked.
- **Harder:** every turn summary and review waits 2 seconds, even when nobody was tapping. A refresh starts the wait again.
- **SDK change:** `useSettled` and `settleDelay`; `Summary` and `Review` use them. A new screen that can appear when time runs out should use `useSettled` too.
