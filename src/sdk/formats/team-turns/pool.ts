import { uniqueBy, type ItemKey } from '../../content/duplicates'
import type { Pack } from '../../content/pack'
import type { Rng } from '../../rng'

/** An item that may have tags. Items without a `tags` field never match a tag filter. */
interface Taggable {
  tags?: readonly string[]
}

/**
 * The items a game will play with: the chosen packs' items, in the order the packs were chosen, each item once,
 * filtered by tag. Runs once, when the game starts.
 *
 * - **Each item once:** an item in two chosen packs is kept from the first pack listed (`uniqueBy`, ADR 0003).
 * - **Tags:** with tags chosen, only items with at least one of them are kept. No tags chosen keeps every item.
 *
 * Returns an empty list when no item matches the tags, so the setup screen can say so. Throws for a pack id that
 * isn't in `packs`: the setup screen only offers packs that exist, so that's a bug, not a player's mistake.
 */
export function choosePoolItems<Item extends Taggable>(
  packs: readonly Pack<Item>[],
  chosen: { packs: readonly string[]; tags: readonly string[] },
  itemKey: ItemKey<Item>,
): Item[] {
  const items = chosen.packs.flatMap((id) => {
    const pack = packs.find((candidate) => candidate.id === id)
    if (!pack) throw new Error(`No pack with id "${id}"`)
    return pack.items
  })

  const wanted = new Set(chosen.tags)
  const matching = wanted.size === 0 ? items : items.filter((item) => item.tags?.some((tag) => wanted.has(tag)))

  return uniqueBy(matching, itemKey)
}

/**
 * The items still to draw, in the order they'll come out, and the ones already drawn since the last shuffle.
 * Plain data, so it's saved with the game.
 */
export interface ItemPool<Item> {
  remaining: Item[]
  drawn: Item[]
}

/** A fresh pool: every item, shuffled. The list passed in is not changed. */
export function newPool<Item>(items: readonly Item[], rng: Rng): ItemPool<Item> {
  return { remaining: rng.shuffle(items), drawn: [] }
}

/**
 * Takes the next item. The pool passed in is not changed; the returned pool has the item moved to `drawn`.
 *
 * When every item has been drawn, the drawn items are shuffled back in and drawing continues, so a game never runs
 * out. The item drawn last goes to the end of the new order, so the card just shown never comes straight back.
 */
export function drawFrom<Item>(pool: ItemPool<Item>, rng: Rng): { item: Item; pool: ItemPool<Item> } {
  let { remaining, drawn } = pool

  if (remaining.length === 0) {
    if (drawn.length === 0) throw new Error('Cannot draw from an empty pool')
    remaining = [...rng.shuffle(drawn.slice(0, -1)), drawn[drawn.length - 1]]
    drawn = []
  }

  const [item, ...rest] = remaining
  return { item, pool: { remaining: rest, drawn: [...drawn, item] } }
}
