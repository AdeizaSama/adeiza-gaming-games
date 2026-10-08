# 0003. The content pack format

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

[ADR 0001](0001-game-standard.md) chose content packs as flat JSON files, one per pack, validated by a schema generated from each game's zod item schema. It left the details open: the exact pack fields and their rules, what counts as a duplicate, how packs are loaded and checked, and how editors get the schema.

Those details are now built (`src/sdk/content/`, `scripts/`, the first pack in `src/games/charades/content/`). Every game's content, and every content contributor, depends on them, so they're recorded here.

The requirements, from the Game Standard and the project's goals:

- Editing content must never need code. Contributors may never have used JSON before, so mistakes must be caught early and explained in plain words.
- The app and CI must agree on what a valid pack is.
- A future form-based content editor must be able to work on the same files.
- Games stay independent: the SDK never imports a game.

## Decision

### Pack fields, checked strictly

Every pack has the same fields, whatever the game:

| Field | Rule |
|---|---|
| `$schema` | Optional. If present, it points at the game's generated JSON Schema. |
| `id` | kebab-case, and equal to the file name: `anime.json` has `"id": "anime"` |
| `name`, `description` | Not blank (spaces alone count as blank) |
| `language` | A language code (simplified BCP 47): `en`, `en-NG`, `pt-BR`, `yo`, `zh-Hans` |
| `maturity` | `everyone`, `teen` or `adult` |
| `contributors` | At least one GitHub username, without `@` |
| `items` | At least one, each checked by the game's item schema |

**Unknown fields are errors.** A misspelled field name (`maturty`) is reported instead of silently ignored. This applies to field names, not values: item text can be any language, with any accents or script.

**`id` equals the file name.** File names in a folder are unique, so this also makes pack ids unique within a game without a separate check, and a preset's `packs: ["anime"]` always means `anime.json`.

**Tags share one format.** The SDK exports a `Tag` schema (kebab-case) that games use in their item schemas, so tags look alike across games.

- *Rejected: lenient objects that ignore unknown fields.* A typo in an optional field would pass and be quietly ignored.
- *Rejected: free-form `language` text ("English").* Codes can be read by browsers and filtered reliably.

### Each game has a standalone `schema.ts`

Every game exports, from `src/games/<id>/schema.ts`:

- `itemSchema`: the zod schema for one item;
- `itemKey`: a function from an item to the text that identifies it, e.g. `(item) => item.text`.

`schema.ts` imports only zod and `src/sdk/`. Scripts load it on its own, without the rest of the game: a game's `index.ts` uses `import.meta.glob` (which only works inside Vite) and imports React views, so a Node script can't load it. `pnpm lint` enforces both sides: scripts may import `schema.ts` but not a game's other files, and `schema.ts` may not import the rest of its game or React.

### Duplicates are compared by the item key

The same item twice **in one pack** is an error. Two items are the same when their keys match after normalizing: Unicode NFC (so an accented letter typed two ways matches), collapsed spaces, and lowercase. **Accents are kept**: `ọkọ` and `oko` are different Yoruba words.

The same item **in two packs** is allowed. When players pick both packs, the game draws it once, keeping the copy from the pack listed first (`uniqueBy`).

`itemKey` is required, written once by the game's developer. Players and content contributors never set it.

- *Rejected: comparing whole items.* `{ "text": "Goku", "modes": ["act"] }` and the same text with `["describe"]` are the same card to players.
- *Rejected: an optional key with a default (a guessed field name).* It would break silently for the next game with a different shape.
- *Rejected: ignoring accents.* It would merge different words in tonal languages and remove real items.
- *Rejected: failing or warning on the same item in two packs.* Both packs are legitimate; handling the overlap during play costs contributors nothing.

### One function decides validity

`checkPack(file, data, itemSchema, itemKey)` in `src/sdk/content/` is the only code that decides whether a pack is valid. It checks the schema, then the id against the file name, then duplicates (the last two only once the shape is right). It returns the pack or a list of problems, each with a path (`items.3.text`) and a message.

- **The app** loads packs with `loadPacks(import.meta.glob(…), itemSchema, itemKey)`, which calls `checkPack` on each file and throws one error listing every problem. CI rejects invalid packs before they're merged, so this only fires during local development, where loud is right.
- **CI** runs `pnpm validate-content`, which reads every pack file, checks it's valid JSON and that its `$schema` path is right, then calls `checkPack`. It prints each problem with the item's text (`items.3 ("Goku")`) and fails the build.

zod's built-in messages are replaced with plain-language ones (`"maturity" is missing`, `Unknown field "maturty": check the spelling, or remove it`). Messages written on a specific field in a schema take priority.

- *Rejected: separate checks in the app and in CI.* They would drift apart.
- *Rejected: skipping invalid packs in the app.* A broken pack would vanish without anyone noticing while developing.

### JSON Schemas are generated and committed

`pnpm generate-schemas` writes `schemas/<game>.pack.schema.json` from `packSchema(itemSchema)` with zod 4's `z.toJSONSchema()`, using `io: 'input'` (so fields with defaults are optional, as contributors write them) and JSON Schema draft 7 (the most widely supported by editors). Field descriptions, written for contributors, are included and shown on hover.

The files are committed, so contributors get editor help without running anything. A test regenerates them in memory and fails if the committed files differ, naming the command that fixes it.

Some rules can't be expressed in JSON Schema and only run in CI: blank text made of spaces, `id` matching the file name, and duplicates. zod `.refine()` checks are dropped in conversion; `uniqueItems` is added by hand where one exists (tags, modes).

- *Rejected: generating schemas at build time only.* Contributors editing on GitHub or without the project installed would get no help.
- *Rejected: writing JSON Schemas by hand.* A second copy of the rules that would drift from zod.

### Scripts run with tsx

Scripts in `scripts/` are TypeScript, run with `tsx` (a dev dependency) and type-checked by `tsconfig.scripts.json`. Node 22 can strip types itself, but requires file extensions in imports, which the SDK doesn't use.

- *Rejected: running the checks as Vitest tests.* Contributors would get test-runner output ("expected false to be true") instead of messages written for them.

## Consequences

- Content contributors get help at three points: the editor underlines most mistakes as they type, CI lists the rest in plain words with the item's text, and CONTRIBUTING explains the rules.
- A new game needs a `schema.ts` with `itemSchema` and `itemKey`, then `pnpm generate-schemas`. Content checks, editor help and duplicate handling then work with no other code.
- Changing a game's item schema or the pack fields means regenerating and committing `schemas/`; the test makes forgetting visible.
- zod becomes a runtime dependency: the app checks packs when it loads them.
- `id` can't contain accents or spaces (it's a file name); the player-facing `name` can.
- Duplicates across packs are resolved during play by the team-turns format (chapter 03), which must call `uniqueBy` when building the item pool.
- Changing the key normalization changes which items count as duplicates in existing packs, so it needs its own decision record.
