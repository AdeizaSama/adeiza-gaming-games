# 0001. The Game Standard

- **Status:** Accepted
- **Date:** 2026-10-01

## Context

Ku Zo Wasa is a library of party games played on one phone, meant to be extended by people who don't know each other: developers add games, designers add themes, and anyone adds words, categories and questions. That only works if there is a written contract that every contribution follows, and if adding content or a theme never requires writing code.

Before writing any code we needed to settle:

- how a game is described, and how much of it is shared between games;
- how a game's flow and rules are expressed so they are readable, type-checked and testable;
- what content looks like, so non-coders can edit it safely;
- how the codebase is split so games stay independent of each other.

## Decision

We adopt the [Game Standard](../game-standard.md) as the contract. Its main decisions:

### Product

- **Single device only.** One phone, passed around or held by a host. No multiplayer across devices.
- **A static site.** No backend, accounts, analytics or personal data. Nothing needs secrets or environment variables to build or run. Game progress is saved only on the player's device.
- **Charades first.** No other game is built until Charades meets the Definition of Done. It's the test that the standard works.
- **Name:** Ku Zo Wasa. The working name "Wasa Games" was already taken.

### Game model

- **Three levels: Format → Game → Variant.** A format is the outer loop (turns, rounds, scoring), a game fills in the turn, and a variant is settings + content only. Games that fit no existing format are deferred rather than forced into one.
- **A hybrid state machine.** Each game's flow is a declarative phase graph (phases, the events each accepts, and where they lead). Its conditions and effects are named, typed TypeScript functions (guards and actions) that live with the game.
  - *Rejected: conditions and effects as JSON objects* (`{ "type": "...", "conditionData": ... }`). Readable for simple rules, but real rules (trivia steals, Mafia night resolution, "mafia ≥ town") would need a JSON condition language: an untyped programming language plus a central interpreter that every new game has to edit.
  - *Rejected: XState.* It covers far more than we need, and contributors would have to learn it. Our runner is small and uses the same concepts (states, events, transitions, guards, actions), so moving to XState later stays possible. That move would need its own decision record.
- **Guards and actions are pure.** Randomness and time are passed in, so every game is deterministic and can be tested by replaying a full game with a seeded random number generator.
- **Credit at every level.** Games (`meta.contributors`), variants (`presets[].contributors`) and content packs (`contributors`) each list the GitHub handles of the people who made them. One field name everywhere.

### Content and themes

- **Content packs are flat JSON files**, one pack per file, validated by a schema generated from each game's zod item schema. This keeps a future form-based content editor possible.
- **Themes are JSON token files** mapped to CSS variables. Components use the variables, never raw colors.

### Codebase

- **Stack:** Vite, React, TypeScript (strict), Tailwind CSS v4, Vitest, pnpm with a single lockfile.
- **One app with strict folder boundaries,** not a multi-package monorepo. We'll revisit only if someone needs the SDK outside this repo.
- **Boundaries are enforced by lint** (ESLint with `eslint-plugin-boundaries`), not by convention:

  | Folder | May import from |
  |---|---|
  | `games/<id>/` | its own folder, `sdk/`, `ui/` |
  | `sdk/` | `sdk/`, `ui/` |
  | `ui/` | `ui/` |
  | `app/` | `app/`, `app/registry/`, `sdk/`, `ui/` |
  | `app/registry/` | `games/`, `sdk/` |

  - *Rejected: oxlint's `no-restricted-imports`* for this. It matches the import text rather than the file the import resolves to, so it flagged valid imports from deep folders and needed a config block per game.
- **Licenses:** MIT for code, CC BY 4.0 for content packs.

## Consequences

- Adding a game means writing a machine, schemas and views against the SDK. Adding content or a theme means editing JSON only.
- Every machine can be tested without a browser.
- The SDK and the content pack format become contracts. Changing either needs a new decision record, because every game depends on them.
- Some games won't fit. They wait for a new format instead of bending an existing one, which is slower but keeps formats coherent.
- The machine runner's exact API isn't fixed by this record. It will be fixed when the runner is built, in a follow-up decision record.
