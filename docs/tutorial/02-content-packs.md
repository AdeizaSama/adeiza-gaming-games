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

---

## Step 3: Finding duplicate items

**What:** two functions in `src/sdk/content/duplicates.ts`, with tests:

- `findDuplicates(items, itemKey)`: lists every item that repeats an earlier one. The content check (step 8) will use it to fail a pack that lists the same item twice.
- `uniqueBy(items, itemKey)`: the items with repeats removed, keeping the first copy. The team-turns format (chapter 03) will use it when players pick several packs that share items.

**Why:** standard §10 says CI rejects packs with duplicate items. "Duplicate" turned out to need a definition.

### What counts as the same item: the item key

Comparing whole items doesn't work. These two are the same word to players, but they aren't equal objects:

```json
{ "text": "Goku", "modes": ["act"] }
{ "text": "Goku", "modes": ["describe"] }
```

Only the game knows which field identifies an item: `text` for Charades, `category` for Name Ten, `question` for Trivia. So each game gives the SDK an **item key**, a function from an item to its identifying text:

```ts
export type ItemKey<Item> = (item: Item) => string

// in src/games/charades/schema.ts (step 6):
export const itemKey: ItemKey<CharadesItem> = (item) => item.text
```

**Who writes it:** the game's developer, once, when the game is created. Players and content contributors never see it. It's **required**, because every default guess is wrong for some game: comparing whole items misses the Goku case above, and guessing a field name breaks silently for the next game.

### Small differences that still count as the same

Before comparing, keys are put in one standard form:

| Step | Example | Why |
|---|---|---|
| Unicode normalization (NFC) | `é` stored as one character, or as `e` plus a separate accent mark, become identical | They look the same on screen, but are different bytes. Different keyboards and editors produce different forms, so without this a duplicate could hide. |
| Collapse and trim spaces | `" Goku "` and `"Monkey  D. Luffy"` become `"Goku"` and `"Monkey D. Luffy"` | Stray spaces are invisible in most editors. |
| Lowercase | `"GOKU"` becomes `"goku"` | The same word in different case is the same item to players. |

**Accents are kept.** `ọkọ` (husband) and `oko` (farm) are different Yoruba words. Many "ignore accents" comparisons strip them, and would wrongly treat these as the same item and remove one. Normalization only makes the *same* accented letter compare equal, whichever way it was typed.

### Within a pack: an error. Across packs: handled during play.

| Where | What happens | Why |
|---|---|---|
| The same item twice **in one pack** | The content check fails (step 8) and says which positions clash | Always a mistake, and the fix is obvious. |
| The same item **in two packs** | Not checked | Both packs are fine on their own: "Goku" belongs in both "Anime" and "Dragon Ball". |
| Players pick **both packs** | `uniqueBy` keeps the first copy, so Goku is drawn once | Nobody has to do anything. If the copies differ (one tagged `act`, one `describe`), the copy from the pack listed first wins. Merging them would add complexity we don't need yet. |

### How it works

`findDuplicates` walks the list once, remembering each normalized key and where it first appeared. When a key it has already seen comes up again, it records that position and the position of the first copy:

```ts
{ index: 2, firstIndex: 0, key: 'Goku' }   // items.2 repeats items.0
```

It returns data, not a message. Turning it into a message for contributors ("items.2 is a duplicate of items.0") is the content check's job in step 8. Positions start at 0 to match error paths like `items.2.text` from step 2.

`uniqueBy` reuses `findDuplicates` and drops every position it reports, so the two can never disagree about what a duplicate is.

### Tests: `src/sdk/content/duplicates.test.ts`

10 tests, using Charades-shaped items `{ text, modes }` with `text` as the key:

| Test | Why it matters |
|---|---|
| No duplicates, or an empty list, gives no results | No false alarms |
| Reports the extra copy's position and the first copy's | Lets the content check point at exact lines |
| Every extra copy is reported, each pointing at the first | All repeats in one CI run |
| Case and extra spaces are ignored | Typing differences don't hide repeats |
| `é` written two ways counts as one | Unicode normalization works |
| `ọkọ` and `oko` stay separate | Accents are kept |
| Items differing only in `modes` are duplicates | Only the key is compared |
| `uniqueBy` keeps the first copy, in order | The two-pack case during play |
| `uniqueBy` returns a new list and leaves the original alone | Data is never changed in place |
| `uniqueBy` handles an empty list | Edge case |

The full table is in [docs/tests.md](../tests.md#duplicate-items).

### Files changed

- `src/sdk/content/duplicates.ts`, `src/sdk/content/duplicates.test.ts` (new).
- `docs/tests.md`: the new tests, and counts updated to 64.

### How to verify

1. `pnpm test` reports `64 passed` (54 before, 10 new).
2. See the accent rule at work: in `duplicates.ts`, add `.normalize('NFD').replace(/\p{M}/gu, '')` after `.toLowerCase()` (this strips accents) and run `pnpm test`. The `ọkọ`/`oko` test fails. Remove it again.
3. `pnpm typecheck` and `pnpm lint` pass.

---

## Step 4: Loading and checking packs

**What:** two functions in `src/sdk/content/loadPacks.ts`, with tests:

- `checkPack(file, data, itemSchema, itemKey)`: checks one pack file and returns either the pack or a list of problems.
- `loadPacks(files, itemSchema, itemKey)`: checks all of a game's pack files and returns the packs, or throws one error listing every problem.

**Why:** steps 2 and 3 built the rules. This step applies them to real files, in the one place both the app and CI will use.

### One function decides what "valid" means

There are two places that read packs:

1. **The app**, which loads a game's packs when it starts (through `loadPacks`).
2. **The content check in CI** (step 8), which reads every pack file and reports problems to contributors.

If each had its own checks, they would drift apart: CI could pass a pack that crashes the app, or reject one the app would accept. So both call `checkPack`, and it's the only code that decides whether a pack is valid.

`checkPack` runs three checks in order:

| Check | Problem reported at | Example message |
|---|---|---|
| 1. The pack schema, with the game's item schema (step 2) | Wherever zod finds it, e.g. `items.1.text` | zod's own message |
| 2. The `id` matches the file name: `anime.json` must have `"id": "anime"` | `id` | `The id must match the file name: "anime" (found "manga")` |
| 3. No item is listed twice, by the game's item key (step 3) | The extra copy, e.g. `items.2` | `"goku" is already in this pack at items.0` |

**If check 1 fails, checks 2 and 3 don't run.** They need a pack whose shape is known (an `id` that is text, `items` that are a list). The contributor fixes the shape, and any id or duplicate problems show up on the next run.

**Why the id must match the file name.** Two files in one folder can't have the same name, so this one rule also guarantees no two packs of a game share an id, with no separate check. It also means the pack a preset names (`packs: ["anime"]`) is always in `anime.json`.

The result is a **discriminated union**, a type with a field that says which case you have:

```ts
type PackCheck<Item> = { ok: true; pack: Pack<Item> } | { ok: false; problems: PackProblem[] }
```

After checking `result.ok`, TypeScript knows whether `result.pack` or `result.problems` exists. It's the same idea as the machine's events (`{ type: 'got' } | { type: 'skip' }`).

### How the app gets the files: `import.meta.glob`

The app runs in a browser, which can't list files in a folder. Vite solves this at build time:

```ts
import.meta.glob('./content/*.json', { eager: true, import: 'default' })
// → { './content/anime.json': { id: 'anime', … }, './content/movies.json': { … } }
```

- **`import.meta.glob`** finds every file matching the pattern when the app is built, and turns them into imports. Adding a pack file is enough; no list to update.
- **`eager: true`** includes the files in the app's code instead of loading each one later when it's needed. Packs are small text files, and games need them all at setup.
- **`import: 'default'`** gives each file's JSON directly. Without it, each value would be wrapped as `{ default: { … } }`.

`loadPacks` doesn't call `import.meta.glob` itself. It takes the result as a plain object, so the tests can pass in made-up files, and the SDK doesn't depend on Vite. `import.meta.glob` only works inside Vite, which is why the CI script (step 8) will read files a different way and call `checkPack` directly.

### Why `loadPacks` throws

An invalid pack can't reach players: CI rejects it before it's merged. So the only time `loadPacks` finds a problem is while someone is editing a pack on their own machine. Then it should be loud and complete: one error, every problem in every file, each with its file and position:

```
Content packs have problems:
  ./content/anime.json, items.1: "Goku" is already in this pack at items.0
  ./content/movies.json, id: The id must match the file name: "movies" (found "films")
```

Packs come back **sorted by id**, so the order is the same on every device whatever order the files are found in. The sort uses a plain comparison rather than `localeCompare`, which can order text differently depending on the device's language settings.

### The standard's example, updated

Standard §3 showed `loadPacks(import.meta.glob("./content/*.json", { eager: true }))`. The real function also needs the item schema and item key, and uses `import: "default"`, so the example now matches it.

### Tests: `src/sdk/content/loadPacks.test.ts`

12 tests:

| Test | Why it matters |
|---|---|
| A valid pack comes back as `ok` | The happy path |
| Every schema problem is listed with its position | All problems at once |
| A file that isn't a pack at all is reported, not crashed on | Even a badly broken file gets a clear message |
| An id that doesn't match the file name is rejected | The id rule |
| The file name is read from Vite paths, Linux paths, Windows paths and bare names | The app and the CI script, on any computer, agree |
| A repeated item is reported at the extra copy, naming the first | The duplicate rule, with the item key |
| Id and duplicate problems are reported together | One report |
| While the shape is wrong, only shape problems are reported | Check order |
| `loadPacks` returns packs sorted by id | Same order everywhere |
| No files gives no packs | Edge case |
| One error lists every problem in every file | What a developer sees |
| The packs have the item schema's type | Types follow the schema |

The full table is in [docs/tests.md](../tests.md#loading-packs).

### Files changed

- `src/sdk/content/loadPacks.ts`, `src/sdk/content/loadPacks.test.ts` (new).
- `docs/game-standard.md` §3: the `loadPacks` example matches the real function.
- `docs/tests.md`: the new tests, and counts updated to 76.

### How to verify

1. `pnpm test` reports `76 passed` (64 before, 12 new).
2. See the error a developer would get: in `loadPacks.test.ts`, change `'films'` to `'movies'` in the "throws one error" test and run `pnpm test`. The test fails, and the output shows the error now lists only the anime problem. Change it back.
3. `pnpm typecheck` and `pnpm lint` pass.

---

## Step 5: Running TypeScript scripts

**What:** set up `scripts/`, the folder for the tools that run outside the app (standard §9): the content check (step 8) and JSON Schema generation (step 7). This step adds:

- [tsx](https://tsx.is), a dev dependency that runs TypeScript files directly in Node.
- `tsconfig.scripts.json`, so `pnpm typecheck` checks scripts too.
- `scripts/lib/games.ts`: `findGames()`, which lists each game folder, its `schema.ts` and its pack files. Both later scripts need it.
- `scripts/validate-content.ts` and `pnpm validate-content`. For now the script only lists what it finds; step 8 adds the checks.

**Why:** the content check can't live inside the app. CI needs a command that reads the pack files, checks them and fails with a clear list of problems.

### Why the script can't use `loadPacks` or a game's `index.ts`

A game's `index.ts` loads its packs with `import.meta.glob`, which only exists inside Vite, and will also import React views. A plain Node script can't load it. So scripts use two things that don't depend on Vite:

- **`findGames()`** reads the folders directly with Node's `fs` instead of `import.meta.glob`.
- **`schema.ts`** in each game exports `itemSchema` and `itemKey`, and imports only zod and `src/sdk/content/`. Scripts load that file and nothing else from a game. This becomes a rule in the standard in step 9.

Both the app and the script end up calling the same `checkPack` from step 4.

### Why tsx

Node can't run our TypeScript as it is:

- Node 22 can strip types from `.ts` files, but it requires full file names in imports (`'../rng.ts'`), and our code imports without extensions (`'../rng'`), as Vite allows.
- tsx runs TypeScript the way Vite resolves it, so scripts can import `src/sdk/` files unchanged.

The alternative was running the checks as Vitest tests. That needs no new package, but contributors would get test-runner errors ("expected false to be true") instead of messages written for them.

tsx is a **dev dependency**: it's used to build and check the project, and never ships to players.

### `tsconfig.scripts.json`

The project already had two TypeScript configs: `tsconfig.app.json` for `src/` (browser code) and `tsconfig.node.json` for `vite.config.ts`. `tsconfig.json` lists them as references, and `pnpm typecheck` (`tsc -b`) checks each one. Before this step, nothing covered `scripts/`, so a type error there would have passed CI.

The new config is like `tsconfig.node.json`, with two differences:

| Setting | Value | Why |
|---|---|---|
| `include` | `["scripts"]` | Its own folder. Files scripts import from `src/sdk/` are checked as well. |
| `module` / `moduleResolution` | `esnext` / `bundler` | Matches how tsx resolves imports, so extensionless imports are allowed. `tsconfig.node.json` uses `nodenext`, which would reject them. |

It has `node` types (for `fs`, `path`) and no `DOM` types: scripts don't run in a browser.

### `findGames()`

```ts
findGames('src/games')
// → [{ id: 'charades', schemaFile: '…/charades/schema.ts', packFiles: ['…/charades/content/anime.json'] }]
```

- **Sorted** game ids and file names, so the output is the same on every computer (folder listing order differs between operating systems).
- **`schemaFile: null`** when a game has no `schema.ts`. The content check reports it as a problem instead of crashing.
- **Only `content/*.json`** counts as a pack: the same pattern the app uses. Notes or drafts in subfolders are ignored by both.
- **A missing `src/games` gives an empty list.** It doesn't exist yet; step 6 creates it.

`validate-content.ts` finds `src/games` from its own location (`new URL('../src/games', import.meta.url)`), not from the folder you run it in, so it works from anywhere.

### Tests: `scripts/lib/games.test.ts`

6 tests. Each one builds a throwaway games folder in the system's temp directory and deletes it afterwards, so no sample folders are committed. Vitest finds test files anywhere in the project, so tests in `scripts/` run with `pnpm test` like the others. The full table is in [docs/tests.md](../tests.md#finding-games-scripts).

### Not yet in the README

`pnpm validate-content` exists but doesn't check anything yet, so it isn't listed in the README's commands or added to CI until step 8, when it does.

### Files changed

- `package.json`, `pnpm-lock.yaml`: tsx, and the `validate-content` script.
- `tsconfig.scripts.json` (new), `tsconfig.json`: the new config is listed as a reference.
- `scripts/lib/games.ts`, `scripts/lib/games.test.ts`, `scripts/validate-content.ts` (new).
- `docs/tests.md`: the new tests, and counts updated to 82.

### How to verify

1. `pnpm install`, then `pnpm test` reports `82 passed` (76 before, 6 new).
2. `pnpm validate-content` prints `No games found in …\src\games`.
3. Check scripts are type-checked: in `scripts/validate-content.ts`, change `games.length` to `games.size` and run `pnpm typecheck`. It reports an error in that file. Change it back.
4. `pnpm lint` passes.

---

## Step 6: The Charades item schema and a starter pack

**What:** the first files in `src/games/charades/`:

- `schema.ts`: what a Charades item is (`itemSchema`) and what makes two items the same (`itemKey`).
- `content/back-to-school.json`: a starter pack of 34 items.
- `schema.test.ts`: tests for both.

Plus a shared `Tag` schema in `src/sdk/content/pack.ts`.

**Why:** the content check needs real content to check (see the note at the top of this chapter). This is the first time the pack schema meets a real game.

### The item

Standard §8 says a Charades item is `{ text, tags[], modes[] }`. In detail:

| Field | Rule | If left out |
|---|---|---|
| `text` | 1 to 50 characters after trimming spaces | Required |
| `tags` | Each one kebab-case (`snack`, `tv-show`), none repeated | `[]` |
| `modes` | Any of `describe`, `act`, `sing`, at least one, none repeated | `["describe"]` |

So the smallest valid item is just:

```json
{ "text": "Puff puff" }
```

**Why `modes` is optional.** Every item can be described. Only some can be acted out or sung. Making `modes` optional with `["describe"]` as the default means contributors only write it when an item can do more:

```json
{ "text": "National Anthem", "tags": ["ritual"], "modes": ["describe", "act", "sing"] }
```

zod's `.default()` fills in missing values when a pack is checked, so the game always gets an item with all three fields. The pack file stays short.

**Why at most 50 characters.** Standard §12 says the game must be readable at arm's length on a phone. Long text either shrinks or wraps onto many lines. 50 leaves room for real titles ("Wait till your father comes" is 27) while stopping full sentences.

**Strict, like packs.** An unknown field is an error. That includes `available_types`, the name an older version of this data used for modes. Silently ignoring it would make every item describe-only without warning.

**Modes are `describe`, `act` and `sing`**, the names in standard §7. Short and readable in JSON.

### The shared `Tag` schema

Every v1 game's items have tags (standard §8), and the library will let players filter by them. If each game wrote its own tag rule, one game might allow `TV Show` and another `tv_show`. So the rule lives in the SDK, beside the pack id rule, which uses the same kebab-case pattern:

```ts
export const Tag = z.string().regex(kebabCase, 'Use lowercase words joined by hyphens, e.g. "tv-show"')
```

### `schema.ts` stands alone

Scripts (steps 7 and 8) load `schema.ts` directly in Node. So it imports only zod and `src/sdk/content/`, never React, views or other game files. A comment at the top of the file says so. The standard gets this rule in step 9.

It exports, under the names scripts will look for:

| Export | What it is |
|---|---|
| `itemSchema` | The zod schema for one item |
| `itemKey` | `(item) => item.text`: two items with the same text are the same item |
| `CharadesItem` | The TypeScript type of an item, for the game's own code |
| `CharadesMode` | The three modes, for the game's own code (chapter 04) |

Standard §3's example now uses `itemSchema` too.

### The starter pack: Back to School

34 items of Nigerian school nostalgia, picked from existing material and reviewed one by one:

- **Spread across kinds:** subjects, rituals, items, playground games, snacks, chores, things teachers said, songs, sports, a place and slang. Each item has one tag saying which.
- **Modes vary**, so the pack exercises every rule: 2 items are describe-only, 31 can be acted, 3 can be sung (one, "Arise O Compatriots", can be sung but not acted).
- **No people.** The original material includes musicians and actors; they're left out of the starter pack, which keeps clear of the content policy's questions about real individuals.
- **`language: "en-NG"`** (Nigerian English), because terms like *Ajebutter* and *Olodo* are Nigerian English.
- **Credited to `AdeizaSama`.**

There's no `$schema` line yet: the file it points to is generated in step 7.

### Tests: `src/games/charades/schema.test.ts`

8 tests: seven for the item rules, and one that loads every real pack in `content/` with the same `loadPacks(import.meta.glob(…))` call the game will use. Vitest runs on Vite, so `import.meta.glob` works in tests too. If any pack is broken, `loadPacks` throws and this test file fails, so CI already catches bad Charades packs. Step 8 adds the friendlier check for contributors.

The full table is in [docs/tests.md](../tests.md#charades-content).

### `src/games/charades/` is incomplete on purpose

Standard §9 says each game folder has an `index.ts` with `defineGame`, a machine, views and rules. Those come in chapters 03 and 04. Nothing imports this folder yet: the app's game list (`src/app/registry/`) doesn't exist, so players won't see Charades until it's finished.

### Files changed

- `src/sdk/content/pack.ts`: exports `Tag`.
- `src/games/charades/schema.ts`, `src/games/charades/schema.test.ts`, `src/games/charades/content/back-to-school.json` (new).
- `docs/game-standard.md` §3: the example uses `itemSchema`.
- `docs/tests.md`: the new tests, and counts updated to 90.

### How to verify

1. `pnpm test` reports `90 passed` (82 before, 8 new).
2. `pnpm validate-content` prints `charades: schema.ts, 1 pack file(s)`.
3. Break the pack: in `back-to-school.json`, change `"Gala"` to `"Pure water"` (a duplicate) and run `pnpm test`. `schema.test.ts` fails with `items.18: "Pure water" is already in this pack at items.17`. Change it back.
4. `pnpm typecheck` and `pnpm lint` pass.
