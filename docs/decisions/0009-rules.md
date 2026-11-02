# 0009. Rules

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

Every game needs rules players can read before they start (standard §13). The Game Standard planned a `rules.md` file per game and an `Instruction` primitive to show it, without deciding how markdown becomes something on screen.

Rules are text that non-coders should be able to fix, like content packs: a typo, a clearer sentence, a rule explained better. So they're written as markdown, which reads well in a pull request and on GitHub.

Constraints:

- **Small and static** (standard §12). The bundle is around 129 KB gzipped; most markdown libraries with React rendering add 20–40 KB more, for features rules don't need.
- **No HTML from contributors.** Rendering markdown to an HTML string and injecting it (`dangerouslySetInnerHTML`) would let a rules file put any HTML on the page. Rules are reviewed, but the safest HTML is HTML that can't get in.
- **Mistakes fail CI, not players.** A table or a link that renders as raw symbols is a bug players would see.

## Decision

### `rules` is required, and written in a small part of markdown

`defineGame` gets a required `rules` field: the text of the game's `rules.md`, imported with Vite's `?raw`. Rules may use:

| Markdown | Shown as |
|---|---|
| `# Title`, `## Section`, `### Subsection` | Headings |
| Lines of text, with a blank line between paragraphs | Paragraphs |
| `- item` | A bulleted list |
| `1. item` | A numbered list |
| `**words**` | Bold |

That's all rules need: say what the game is, how a turn works, how scoring works, and tips.

### Anything else is an error, with its line

Our own parser, `parseMarkdown` in `src/sdk/interactions/markdown.ts`, turns the text into blocks (heading, paragraph, list) made of plain and bold runs of text. React renders those as elements, so there's no HTML string anywhere.

The parser also reports what it doesn't support, with the line number: tables, links, images, code, quotes, `*` lists, italics, nested or indented lines, headings deeper than `###`, an unclosed `**`, and raw HTML. `defineGame` throws if the rules have any of these, so a game's tests fail before the mistake ships. The message says what to do instead, e.g. "Line 7: links aren't supported; write the address as text".

### `Instruction` shows it

The `Instruction` primitive (standard §6) shows a title, markdown text from the subset, and one action button. It's for rules and for any later step that needs explaining, like a host-led game's night phase.

### Rejected

- **A markdown library** (`marked`, `markdown-it`, `react-markdown`). Each supports far more than rules need, so mistakes like tables would render instead of failing. Most produce HTML strings, and the React ones add more to the bundle than all of our own parser.
- **Rules as TypeScript or JSON data.** No markdown to parse, but a non-coder can't fix a sentence without learning the shape. Markdown is how GitHub shows text, so a contributor can read their change as players will.

## Consequences

- **Easier:** fixing a rule is editing a text file, like editing a pack. Any construct that wouldn't show properly fails CI with the line number.
- **Easier:** no HTML from files reaches the page, and nothing is added to the bundle but the parser.
- **Harder:** a writer who wants a table or a link has to say it in words. If rules ever need more, adding a construct is a parser change with tests, and an amendment to this record.
- **SDK change:** `defineGame` requires `rules`; `Instruction` is built.
