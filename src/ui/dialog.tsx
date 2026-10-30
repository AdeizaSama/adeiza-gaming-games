import { useEffect, useId, useRef, type ReactNode } from 'react'

export interface DialogProps {
  open: boolean
  /** Called when the dialog asks to close: Escape, the Android back button, or a tap outside it. */
  onClose: () => void
  title: string
  description?: string
  /** The dialog's buttons. */
  children: ReactNode
}

/**
 * A modal dialog: a question on top of the page, which can't be used until it's answered. Built on the browser's own
 * `<dialog>` element, which already keeps focus inside it and closes on Escape; shadcn/ui's Dialog would add a Radix
 * package to do the same.
 */
export function Dialog({ open, onClose, title, description, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()

  // `<dialog>` is opened and closed by calling its methods, not by an attribute, so the `open` prop is applied here.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      onClose={onClose}
      // A tap on the dimmed area outside lands on the <dialog> itself; a tap inside lands on its content.
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className="m-auto w-[calc(100%-3rem)] max-w-sm rounded-xl bg-card p-0 text-card-foreground shadow-lg backdrop:bg-background/80"
    >
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h2 id={`${id}-title`} className="text-2xl font-bold">
            {title}
          </h2>
          {description && (
            <p id={`${id}-description`} className="text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3">{children}</div>
      </div>
    </dialog>
  )
}
