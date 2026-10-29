import { Drama, Gamepad2, type LucideIcon } from 'lucide-react'

/**
 * The icons games can use, by the name in `meta.icon` (lucide's names: https://lucide.dev/icons).
 * Each icon is imported by itself so only the ones listed end up in the app; importing every icon by name would add
 * over a thousand. A new game whose icon isn't listed adds it here.
 */
export const gameIcons: Record<string, LucideIcon> = {
  drama: Drama,
}

/** The icon for a game, or a plain game controller if its name isn't listed. */
export function gameIcon(name: string): LucideIcon {
  return gameIcons[name] ?? Gamepad2
}
