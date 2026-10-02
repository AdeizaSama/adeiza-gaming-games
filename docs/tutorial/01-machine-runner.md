# 01 — Machine runner

**Goal of this chapter:** build the core of the game SDK: a seeded random number generator, the machine types, `defineMachine` and the runner that plays a machine. The chapter ends when a small test machine plays a full game from start to finish in tests. No screens yet.

**Branch:** `chapter/01-machine-runner`

**Where this fits.** Phase 1 of the roadmap (the SDK and Charades) is split into four chapters, so each one ends in something that works, is reviewed and is merged before the next builds on it:

| Chapter | Scope | Ends with |
|---|---|---|
| **01: Machine runner** (this one) | Rng, machine types, `defineMachine`, the runner, a decision record for the runner API | A test machine plays a full game in tests |
| 02: Content packs | zod, the pack schema, loading packs, JSON Schema generation, `validate-content` in CI | All five CI checks are real |
| 03: team-turns format | The format's phases, guards and actions, `defineGame`, the shared interaction primitives, the app shell (library, setup, save and resume) | A placeholder game is playable on a phone |
| 04: Charades | Item schema, machine, views, first content pack, rules | Charades meets the Definition of Done |

One big chapter would have meant one huge pull request, with the runner's design only tested by Charades at the very end. Split, the runner is merged and used before anything large depends on it.

---

## Step 1: Choose how pull requests are merged

**What:** allow two merge methods, squash and rebase, and say in the standard when to use each.

**Why:** chapter 00 showed the problem. GitHub offers three ways to merge a PR:

| Method | What lands on `main` |
|---|---|
| Merge commit | Every commit from the branch, plus an extra "Merge pull request" commit, with a branching history |
| Squash | One commit for the whole PR |
| Rebase | Every commit from the branch, in a straight line, with no extra commit |

Squash suits most PRs: contributors' branches often contain commits like "fix typo" or "wip" that nobody needs on `main`, and one commit per PR is easy to revert. But the tutorial chapters are built one step per commit, with Conventional Commit messages. Squashing a chapter would fold all its steps into a single commit, so the history could no longer be followed step by step.

So:

- **Squash by default.** The PR title becomes the commit message.
- **Rebase when every commit stands on its own** and follows Conventional Commits, as tutorial chapters do.
- **No merge commits.** They add a commit that says nothing and make the history branch.

**Settings (on GitHub):** **Settings → General → Pull Requests**:

- tick **Allow squash merging**, and set its default message to **Default to pull request title**;
- tick **Allow rebase merging**;
- untick **Allow merge commits**.

**Files changed:**

- `docs/game-standard.md` §12: the merge rule.
- `CONTRIBUTING.md`: PRs are usually squashed, so branch commits don't need to be tidy, but the PR title must follow Conventional Commits.
- `docs/tutorial/01-machine-runner.md` (new, this file).

**How to verify:** open any PR. The merge button's dropdown offers **Squash and merge** and **Rebase and merge**, and nothing else.
