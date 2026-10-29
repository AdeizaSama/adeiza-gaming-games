import { Link } from 'react-router'

/** Any address that isn't a page or a game: a mistyped link, or a game that was removed. */
export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-muted-foreground">There's no game or page at this address.</p>
      <Link to="/" className="text-lg font-semibold text-primary underline underline-offset-4">
        Back to games
      </Link>
    </main>
  )
}
