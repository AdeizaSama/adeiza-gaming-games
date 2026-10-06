/**
 * Turns an item into the text that identifies it. Each game writes one, once, in its `schema.ts`:
 *
 *   export const itemKey: ItemKey<CharadesItem> = (item) => item.text
 *
 * Two items with the same key are the same item, even if their other fields (tags, modes) differ.
 */
export type ItemKey<Item> = (item: Item) => string

/** An item whose key matches an earlier item's. Positions start at 0, like `items.0` in error paths. */
export interface Duplicate {
  /** Where the extra copy is. */
  index: number
  /** Where the first copy is. */
  firstIndex: number
  /** The extra copy's key, as written. */
  key: string
}

/**
 * The form keys are compared in, so small typing differences don't hide a duplicate:
 * - `normalize('NFC')`: an accented letter can be stored as one character (é) or as a letter plus an accent mark
 *   (e + ´). They look identical; this makes them identical.
 * - collapse runs of spaces into one and trim the ends, so `" Goku "` matches `"Goku"`.
 * - lowercase, so `"GOKU"` matches `"Goku"`.
 *
 * Accents are kept: `ọkọ` and `oko` are different words in Yoruba, so they must not count as duplicates.
 */
function normalizeKey(key: string): string {
  return key.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase()
}

/**
 * Finds items that repeat an earlier item, by key. Returns one entry per extra copy; empty means no duplicates.
 * Used by the content check to fail a pack that lists the same item twice.
 */
export function findDuplicates<Item>(items: readonly Item[], itemKey: ItemKey<Item>): Duplicate[] {
  const firstSeen = new Map<string, number>()
  const duplicates: Duplicate[] = []

  items.forEach((item, index) => {
    const key = itemKey(item)
    const normalized = normalizeKey(key)
    const firstIndex = firstSeen.get(normalized)
    if (firstIndex === undefined) firstSeen.set(normalized, index)
    else duplicates.push({ index, firstIndex, key })
  })

  return duplicates
}

/**
 * The items without duplicates, keeping the first copy of each and the original order. The original is not changed.
 * Used when players pick several packs that share items, so each item is drawn at most once.
 */
export function uniqueBy<Item>(items: readonly Item[], itemKey: ItemKey<Item>): Item[] {
  const extraCopies = new Set(findDuplicates(items, itemKey).map((duplicate) => duplicate.index))
  return items.filter((_, index) => !extraCopies.has(index))
}
