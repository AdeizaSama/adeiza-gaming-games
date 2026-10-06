# 02 — Content packs

**Goal of this chapter:** define what a content pack is and check every pack automatically: the pack schema, loading packs, JSON Schemas generated for editors, and the `validate-content` check in CI. At the end, all five CI checks from standard §12 are real.

**Branch:** `chapter/02-content-packs`

**Charades content comes early.** Packs belong to a game, and their items are checked against that game's item schema. The first game, Charades, is built in chapter 04, so a content check written now would have nothing to check. This chapter therefore brings two pieces of Charades forward: its item schema and one starter pack. The rest of the game (machine, views, rules) stays in chapter 04. Until then `src/games/charades/` is incomplete on purpose.

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

---

## Step 2: The pack schema

**What:** add [zod](https://zod.dev) and write the schema every content pack follows, in `src/sdk/content/pack.ts`, with tests.

**Why:** standard §10 describes a pack in words. A schema turns those words into a check a computer can run: in the app, in CI, and (from step 7) in your editor while you type. Content contributors don't write code, so this check is how they find their mistakes, and its error messages are written for them.

### Why zod

zod describes the shape of data once and gives us three things from that one description:

1. **A check at runtime:** `schema.safeParse(json)` says whether a pack is valid, and if not, exactly where (`items.3.text`).
2. **A TypeScript type:** `z.infer<typeof schema>`, so the code that uses a pack can't drift from the check.
3. **A JSON Schema:** `z.toJSONSchema(schema)`, built into zod 4, which editors use to autocomplete and flag mistakes (step 7). No second library needed.

It's a **runtime dependency** (in `dependencies`, not `devDependencies`) because the app will check packs and game settings in the browser too. The standard says new runtime dependencies must be justified; this is the justification, and it goes in the PR description too.

### Two halves: shared fields and the game's items

Every pack has the same outer fields, whatever the game. Only `items` differs: a Charades item is `{ text, tags, modes }`, a Trivia item is `{ question, options, answer, difficulty }`. So the schema comes in two parts:

```ts
export const PackInfo = z.strictObject({ $schema, id, name, description, language, maturity, contributors })

export function packSchema(itemSchema) {
  return PackInfo.extend({ items: z.array(itemSchema).min(1) })
}
```

A game calls `packSchema(CharadesItem)` and gets the full schema for its packs. The SDK never needs to know what a Charades item looks like, which keeps the folder rule "the SDK never imports a game" (standard §9).

### The rules, field by field

| Field | Rule | Why |
|---|---|---|
| `$schema` | Optional text | Points editors at the generated JSON Schema (step 7). Ignored by the game. Must be allowed, or the strict check below would reject it. |
| `id` | kebab-case: `animals`, `movies-90s` | Ids appear in presets (`packs: ["anime"]`) and will be matched to filenames (step 4). One spelling style avoids `Anime` vs `anime` mix-ups. |
| `name`, `description` | Not blank | Shown in the library. `trim()` first, so `"   "` counts as blank. |
| `language` | A language code: `en`, `en-GB`, `pt-BR`, `yo`, `zh-Hans` | A simplified [BCP 47](https://www.rfc-editor.org/info/bcp47) tag, the standard browsers use. The full standard has more rules than we need; this pattern accepts everything we'd realistically use and rejects `English` and `en_GB`. |
| `maturity` | `everyone`, `teen` or `adult` | From standard §10. Exported as `Maturity` so the library's filter (later) uses the same list. |
| `contributors` | At least one GitHub username | Credit is required (standard §3). The pattern follows GitHub's own rules (letters, digits, single hyphens, at most 39 characters), so `@AdeizaSama` (with the `@`) is caught. |
| `items` | At least one, each checked by the game's item schema | An empty pack is almost certainly a mistake. |

**Strict means unknown fields are errors.** `z.strictObject` rejects fields it doesn't know. Without it, a typo like `"maturty": "teen"` would be silently dropped, and the error would say `maturity` is missing instead of pointing at the typo. A typo in an optional field would be worse: the pack would pass, and the setting would be quietly ignored. `.extend()` keeps the strictness. Whether *items* are strict is up to each game's item schema.

### `Pack<Item>`

```ts
export interface Pack<Item> extends PackInfo {
  items: Item[]
}
```

The type code uses for a loaded pack. A test checks it's exactly what zod infers from `packSchema`, so the type and the check can't drift apart.

### Tests: `src/sdk/content/pack.test.ts`

12 tests, using a tiny stand-in item schema `{ text }` instead of a real game's:

| Test | Why it matters |
|---|---|
| A valid pack passes unchanged; `$schema` is allowed | The happy path, and the editor line doesn't break it |
| An unknown field (`maturty`) is rejected | The strictness promise |
| A missing field is rejected | Required fields are required |
| `id`, `language`, `maturity`, `contributors`: valid and invalid examples of each | Each rule in the table above, including the edge cases (`movies--90s`, `en_GB`, `@AdeizaSama`, a 40-character name) |
| A bad item is reported at its path (`items.1.text`) | Errors point contributors at the exact item |
| An empty `items` list is rejected | |
| `z.infer` of the schema equals `Pack<Item>` | Type and check agree |

The tests check *where* each error is (the path), not the wording of the message. Wording will change as we improve it; the path shouldn't.

### Files changed

- `package.json`, `pnpm-lock.yaml`: zod 4.
- `src/sdk/content/pack.ts`, `src/sdk/content/pack.test.ts` (new).
- `docs/tests.md` (new): a catalog of every test (what it checks, its input, the expected result and why), so the tests can be understood without reading the code. Any step that changes a test updates it in the same commit.

### How to verify

1. `pnpm install`, then `pnpm test` reports `54 passed` (42 from chapter 01, 12 new).
2. See strictness at work: in `pack.ts`, change `z.strictObject` to `z.object` and run `pnpm test`. The "rejects an unknown field" test fails. Change it back.
3. `pnpm typecheck` and `pnpm lint` pass.
