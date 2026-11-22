import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { AnyGame } from '../registry'

/** "2–20 players". */
export const players = (game: AnyGame) => `${game.meta.players.min}–${game.meta.players.max} players`

/** A page of the library below home (Browse, Custom game): a way back home, a title, a line under it, the rest. */
export function LibraryLayout({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <Link to="/" className="flex min-h-11 items-center gap-1 self-start text-muted-foreground">
          <ChevronLeft aria-hidden className="size-5" />
          Home
        </Link>
        <h1 className="text-4xl font-bold">{title}</h1>
        <p className="text-lg text-muted-foreground">{description}</p>
      </header>
      {children}
    </main>
  )
}

/** The two-column grid of cards, named for screen readers. */
export function CardGrid({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul aria-label={label} className="grid grid-cols-2 gap-3">
      {children}
    </ul>
  )
}
