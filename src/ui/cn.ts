import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge, told about our own utilities from `index.css`. Without this it reads `border-line` as a border
 * color, and drops it when a real color like `border-border` follows, leaving the border with no width.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'border-w': ['border-line'],
      'font-family': ['font-heading'],
    },
  },
})

/**
 * Joins class names, dropping empty ones, and lets later classes win over earlier ones that set the same thing:
 * `cn('bg-primary px-4', 'bg-secondary')` is `'px-4 bg-secondary'`. Components put their own classes first and the
 * caller's `className` last, so a caller can adjust a component without fighting it.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return twMerge(...classes)
}
