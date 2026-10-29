import type { ComponentProps } from 'react'
import { cn } from './cn'

/** The looks a button can have. Each uses theme tokens only (standard §11). */
const variants = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-success text-success-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  outline: 'border-2 border-border bg-transparent text-foreground',
  ghost: 'bg-transparent text-foreground',
}

/** Sizes. Even the smallest is 48px tall: easy to hit with a thumb (standard §12 asks for at least 44px). */
const sizes = {
  md: 'h-12 px-5 text-base',
  lg: 'h-16 px-8 text-xl',
  icon: 'size-12',
}

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

/**
 * A button. Based on shadcn/ui's Button, cut down to what this app uses.
 * `type` defaults to `"button"`: a plain `<button>` inside a form submits it, which is rarely what's wanted.
 */
export function Button({ variant = 'primary', size = 'md', type = 'button', className, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold select-none',
        'transition-[transform,opacity] active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100',
        'focus-visible:outline-3 focus-visible:outline-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
