/**
 * The categories a variant can be in (ADR 0021): what Browse filters by. The list is `categories.json`, next to this
 * file, in the order the filter shows them. Adding one is adding a line there, then `pnpm generate-schemas` so editors
 * suggest it in variant files.
 */
import { z } from 'zod'
import list from './categories.json'
import { Tag } from './pack'

const CategoryList = z
  .array(z.strictObject({ id: Tag, label: z.string().trim().min(1).max(20, 'Keep a label to 20 characters: it goes on a button') }))
  .min(1)
  .refine((categories) => new Set(categories.map(({ id }) => id)).size === categories.length, 'Each category id must be used once')

/** A category: its id, used in variant files, and its label, shown to players. */
export type Category = z.infer<typeof CategoryList>[number]

/**
 * Checks a list of categories, throwing if it's broken. The app and the scripts both load `categories.json` with it,
 * so a mistake in the file stops the build and CI rather than reaching players.
 */
export function loadCategories(data: unknown): Category[] {
  const parsed = CategoryList.safeParse(data)
  if (!parsed.success) throw new Error(`categories.json has problems:\n${parsed.error.issues.map((issue) => `  ${issue.path.join('.') || 'whole file'}: ${issue.message}`).join('\n')}`)
  return parsed.data
}

/** Every category, in the order Browse shows them. */
export const categories: readonly Category[] = loadCategories(list)

/** The label for a category id. */
export function categoryLabel(id: string): string {
  return categories.find((category) => category.id === id)?.label ?? id
}
