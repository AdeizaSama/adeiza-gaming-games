import type { ComponentProps } from 'react'
import { cn } from './cn'

/**
 * A one-line text field. Based on shadcn/ui's Input.
 * The text is 16px (`text-base`): phones zoom the whole page into any smaller text field when it's tapped.
 */
export function Input({ type = 'text', className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'h-12 w-full rounded-md border-2 border-input bg-card px-4 text-base text-card-foreground',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-3 focus-visible:outline-offset-2',
        'disabled:opacity-50 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}
