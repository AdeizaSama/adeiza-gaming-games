<!--
Title: use Conventional Commits, e.g. "feat(charades): add sing mode" or "content(charades): add anime pack".
Delete the sections that don't apply.
-->

## What and why

<!-- What does this change, and why? Link the issue: "Closes #123". -->

## Type

- [ ] Content (packs only, no code)
- [ ] Theme (token file only, no code)
- [ ] New game
- [ ] Change to an existing game
- [ ] SDK, format or content pack format change
- [ ] App shell, tooling or docs

## Checklist

- [ ] `pnpm lint`, `pnpm test` and `pnpm build` pass locally
- [ ] I added my GitHub handle to `contributors` where I created or substantially changed a game, variant or pack

**Content**

- [ ] Packs pass validation, with no duplicate items
- [ ] `maturity` is set correctly
- [ ] Nothing about private individuals, nothing hateful, text only

**Games** (see the [Definition of Done](https://github.com/AdeizaSama/adeiza-gaming-games/blob/main/docs/game-standard.md#13-definition-of-done-per-game))

- [ ] Fits an existing format
- [ ] Guards and actions are pure; full-playthrough test plus per-guard and per-action tests
- [ ] Works on a 360px-wide phone, including resume after refresh
- [ ] Custom UI (if any) is explained below

**SDK and contracts**

- [ ] Changes to `src/sdk/` or the content pack format have a decision record in `docs/decisions/` (link: )
- [ ] New runtime dependencies (if any) are justified below

## Notes for the reviewer

<!-- Custom UI reasons, dependency justification, screenshots, anything else. -->
