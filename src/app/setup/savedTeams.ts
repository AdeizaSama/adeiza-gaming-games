import { z } from 'zod'

/**
 * The last team names used on this device, so the same group of friends doesn't retype them every game.
 * Kept in the browser's localStorage: they never leave the phone.
 */
const key = 'ku-zo-wasa:teams'

/** What a saved list must look like. Anything else (an old format, a hand edit) is ignored. */
const SavedTeams = z.array(z.string()).min(2).max(10)

/** The saved team names, or `undefined` if there are none (or they can't be read). */
export function loadTeams(storage: Storage = localStorage): string[] | undefined {
  try {
    const saved = SavedTeams.safeParse(JSON.parse(storage.getItem(key) ?? 'null'))
    return saved.success ? saved.data : undefined
  } catch {
    // Not JSON, or storage is switched off (some private browsing modes).
    return undefined
  }
}

/** Saves the team names for next time. Does nothing if storage is switched off: remembering is a nicety. */
export function saveTeams(teams: readonly string[], storage: Storage = localStorage): void {
  try {
    storage.setItem(key, JSON.stringify(teams))
  } catch {
    // Storage full or switched off.
  }
}
