# Decision records

Short documents that record a decision about the project's contracts: the Game Standard, the SDK (`src/sdk/`) and the content pack format. Every game depends on these, so changes to them are written down with their reasons.

| # | Decision | Status |
|---|---|---|
| [0001](0001-game-standard.md) | The Game Standard | Accepted |

## Writing one

Create `NNNN-short-title.md` with the next number, and add it to the table above in the same pull request. Use these sections:

- **Status:** Proposed, Accepted, or Superseded by NNNN
- **Context:** the problem, and what forces the decision
- **Decision:** what we chose, and the options we rejected and why
- **Consequences:** what becomes easier, what becomes harder, what follows from it

Records are not edited after they're accepted. To change a decision, write a new record that supersedes the old one.
