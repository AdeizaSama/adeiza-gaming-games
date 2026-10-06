# 02 — Content packs

**Goal of this chapter:** define what a content pack is and check every pack automatically: the pack schema, loading packs, JSON Schemas generated for editors, and the `validate-content` check in CI. At the end, all five CI checks from standard §12 are real.

**Branch:** `chapter/02-content-packs`

---

## Step 1: Merge chapters with a merge commit

**What:** change how chapter pull requests are merged, from **rebase** to **merge commit**. Other pull requests are still squashed.

**Why:** chapter 01 was the first chapter merged with **Rebase and merge**, and it showed two problems.

1. **Rebase rewrites every commit.** GitHub doesn't move the branch's commits onto `main`; it creates copies with new IDs (hashes). The original commits stay on the branch, so a Git client shows every step twice, once on `main` and once on the branch, until the branch is deleted. Deleting it needs `git branch -D` (force), because Git compares commits by ID and the originals' IDs aren't on `main`.
2. **Chapter boundaries disappear.** With a straight line of commits, nothing in `git log` says where chapter 01 ends and chapter 02 begins.

The goal in chapter 01, step 1 was "don't squash chapters", so each step stays its own commit. A merge commit does that too:

| | Rebase and merge | Merge commit |
|---|---|---|
| Each step a separate commit on `main` | Yes | Yes |
| Commit IDs | New copies | Kept: the commits you made are the ones on `main` |
| Where a chapter starts and ends | Invisible | One "Merge pull request" commit per chapter |
| One line per chapter | Not possible | `git log --first-parent` |
| History | One straight line | Branches and rejoins once per chapter |

A straight line matters most when many small pull requests land every day, and those are still squashed. For a history organised by chapter, the merge commit is a "chapter ends here" marker, which is what we want.

Chapter 01 stays rebased. Rewriting `main` to change it would be worse than one inconsistent chapter.

**The rule now:**

- **Squash by default.** The PR title becomes the commit message.
- **Merge commit** when every commit stands on its own and follows Conventional Commits, as tutorial chapters do.
- **No rebase merging.**

### Settings (on GitHub)

Two places, because a branch ruleset overrides the repo-wide setting for that branch. In chapter 01 the repo allowed rebase, but the `main` ruleset only allowed squash, so the PR only offered squash.

1. **Settings → General → Pull Requests**: tick **Allow merge commits** and **Allow squash merging** (default message: **Default to pull request title**); untick **Allow rebase merging**.
2. **Settings → Rules → Rulesets → Main Protection → Require a pull request before merging → Allowed merge methods**: **Merge** and **Squash**.

### Files changed

- `docs/game-standard.md` §12: the merge rule.
- `docs/tutorial/01-machine-runner.md`: a note under step 1 pointing here.
- `docs/tutorial/02-content-packs.md` (new, this file).

### How to verify

1. Open this chapter's PR. The merge button's dropdown offers **Create a merge commit** and **Squash and merge**, and not rebase.
2. After merging, `git log --oneline --first-parent origin/main -3` shows a "Merge pull request" commit for this chapter, and `git log --oneline origin/main` shows each step underneath it with the same IDs as on your branch.
