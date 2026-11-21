# Decision records

Short documents that record a decision about the project's contracts: the Game Standard, the SDK (`src/sdk/`) and the content pack format. Every game depends on these, so changes to them are written down with their reasons.

| # | Decision | Status |
|---|---|---|
| [0001](0001-game-standard.md) | The Game Standard | Accepted; amended by 0002 |
| [0002](0002-machine-runner.md) | The machine runner API | Accepted |
| [0003](0003-content-packs.md) | The content pack format | Accepted |
| [0004](0004-team-turns-builder.md) | How a game plugs its turn into the team-turns format | Accepted; amended by 0014, 0019 |
| [0005](0005-views.md) | Views: how each phase is shown | Accepted |
| [0006](0006-save-and-resume.md) | Save and resume | Accepted |
| [0007](0007-turn-review.md) | Turn review | Accepted |
| [0008](0008-settings-and-presets.md) | Game settings and presets on setup | Accepted; amended by 0018 (presets replaced by variants) |
| [0009](0009-rules.md) | Rules | Accepted |
| [0010](0010-theme-files.md) | Theme files | Accepted |
| [0011](0011-theme-parts.md) | Theme parts | Accepted |
| [0012](0012-name-ten.md) | Name Ten: an answer board and a judge | Accepted |
| [0013](0013-fit-the-screen-and-standings.md) | A board that fits the screen, and standings after every turn | Accepted |
| [0014](0014-a-phase-before-the-turn.md) | A phase before the turn | Accepted; amends 0004 |
| [0015](0015-trivia-night.md) | Trivia Night: multiple choice, three ways to play | Accepted |
| [0016](0016-a-pause-after-time-runs-out.md) | A pause after time runs out | Accepted |
| [0017](0017-a-shared-choice-turn-and-this-or-that.md) | A shared multiple-choice turn, and This or That | Accepted; amended by 0018 (This or That is a variant) |
| [0018](0018-variants.md) | Variants | Accepted; amends 0008, 0017 |
| [0019](0019-free-play.md) | Free Play | Accepted; amends 0004 |

## Writing one

Create `NNNN-short-title.md` with the next number, and add it to the table above in the same pull request. Use these sections:

- **Status:** Proposed, Accepted, Amended by NNNN (one point changed by a later record), or Superseded by NNNN (replaced entirely)
- **Context:** the problem, and what forces the decision
- **Decision:** what we chose, and the options we rejected and why
- **Consequences:** what becomes easier, what becomes harder, what follows from it

Records are not edited after they're accepted. To change a decision, write a new record that amends or supersedes the old one, and update the status in the table above.
