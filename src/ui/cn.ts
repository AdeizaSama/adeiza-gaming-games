import { twMerge } from 'tailwind-merge'

/**
 * Joins class names, dropping empty ones, and lets later classes win over earlier ones that set the same thing:
 * `cn('bg-primary px-4', 'bg-secondary')` is `'px-4 bg-secondary'`. Components put their own classes first and the
 * caller's `className` last, so a caller can adjust a component without fighting it.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return twMerge(...classes)
}
