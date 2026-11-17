import { Palette } from 'lucide-react'
import { useState } from 'react'
import { fonts } from '../../sdk/theme/fonts'
import type { Theme } from '../../sdk/theme/schema'
import { Button } from '../../ui/button'
import { Dialog } from '../../ui/dialog'
import { pickTheme, startingTheme, themes } from './themes'

/**
 * The Theme button in the library header, and the dialog it opens (ADR 0010). A tap on a theme applies it at once,
 * so players see it behind the dialog, and remembers it on this device.
 */
export function ThemePicker() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(() => startingTheme().id)

  return (
    <>
      <Button size="icon" variant="ghost" aria-label="Theme" onClick={() => setOpen(true)}>
        <Palette aria-hidden />
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Theme" description="How the app looks on this phone.">
        <div role="radiogroup" aria-label="Themes" className="flex max-h-[55dvh] flex-col gap-3 overflow-y-auto">
          {themes.map((theme) => (
            <label key={theme.id} className="flex items-center gap-3 rounded-xl p-2">
              <input
                type="radio"
                name="theme"
                className="size-5 shrink-0 accent-primary"
                checked={current === theme.id}
                onChange={() => {
                  pickTheme(theme)
                  setCurrent(theme.id)
                }}
              />
              <Swatch theme={theme} />
              <span className="flex flex-col">
                <span className="font-semibold">{theme.name}</span>
                <span className="text-sm text-muted-foreground">{theme.description}</span>
              </span>
            </label>
          ))}
        </div>
        <Button onClick={() => setOpen(false)}>Done</Button>
      </Dialog>
    </>
  )
}

/**
 * A small preview of a theme, in its own colors and heading font: its page, a card, and its main color. Inline styles,
 * because it shows a theme that isn't the one applied; the colors come from the theme file, not from Tailwind.
 */
function Swatch({ theme }: { theme: Theme }) {
  const { colors } = theme
  return (
    <span
      aria-hidden
      className="flex h-14 w-16 shrink-0 items-end justify-between rounded-lg p-1.5"
      style={{ background: colors.background, outline: `1px solid ${colors.border}` }}
    >
      <span
        className="rounded-md px-1.5 text-lg leading-tight font-bold"
        style={{ background: colors.card, color: colors['card-foreground'], fontFamily: fonts[theme.fonts.heading].family }}
      >
        Aa
      </span>
      <span className="size-4 rounded-full" style={{ background: colors.primary }} />
    </span>
  )
}
