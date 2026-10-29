import { z } from 'zod'
import { findDuplicates } from '../../content/duplicates'
import { PackInfo, Tag } from '../../content/pack'

/** The same text twice, compared the way item keys are (ignoring case and extra spaces). `[]` means no repeats. */
function repeats(values: readonly string[]): number[] {
  return findDuplicates(values, (value) => value).map((duplicate) => duplicate.index)
}

/**
 * The settings players choose on the setup screen for any team-turns game (standard §7).
 * A game with its own settings extends it: `TeamTurnsConfig.extend({ punishSkips: z.boolean().default(false) })`.
 *
 * Strict, like packs: an unknown setting (often a typo, or one left over from an old saved game) is an error.
 */
export const TeamTurnsConfig = z.strictObject({
  /** In playing order: the first team listed plays first. */
  teams: z
    .array(z.string().trim().min(1, 'Give every team a name').max(20, 'Keep team names to 20 characters'))
    .min(2, 'Add at least two teams')
    .max(10, 'Up to 10 teams')
    .superRefine((teams, context) => {
      for (const index of repeats(teams)) {
        context.addIssue({ code: 'custom', path: [index], message: 'Two teams have this name' })
      }
    }),
  /** How many times every team plays a turn. */
  rounds: z.int().min(1).max(10).default(3),
  /** How long each turn lasts. */
  seconds: z.int().min(10).max(300).default(60),
  /** Ids of the content packs to draw items from. */
  packs: z
    .array(PackInfo.shape.id)
    .min(1, 'Pick at least one pack')
    .refine((packs) => repeats(packs).length === 0, 'Remove the repeated pack'),
  /** Only play items with at least one of these tags. Empty plays every item. */
  tags: z
    .array(Tag)
    .default([])
    .refine((tags) => repeats(tags).length === 0, 'Remove the repeated tag'),
})

/** Settings after checking, with defaults filled in: what the machine receives. */
export type TeamTurnsConfig = z.output<typeof TeamTurnsConfig>

/** Settings as the setup screen sends them, before defaults are filled in. */
export type TeamTurnsSetup = z.input<typeof TeamTurnsConfig>
