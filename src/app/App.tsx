import { useEffect } from 'react'
import { Route, Routes, useLocation, useNavigationType } from 'react-router'
import { BrowsePage } from './library/BrowsePage'
import { LibraryPage } from './library/LibraryPage'
import { NotFoundPage } from './NotFoundPage'
import { PlayPage } from './play/PlayPage'
import { RulesPage } from './rules/RulesPage'
import { SetupPage } from './setup/SetupPage'

/**
 * Starts every new page at the top. Without it, the browser keeps the old page's scroll position: tap a game far
 * down the home page and its setup opens halfway down. Going back (a "POP", the browser's Back) is left alone, so
 * the browser can return players to where they were.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()
  const navigation = useNavigationType()
  useEffect(() => {
    if (navigation !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navigation])
  return null
}

/**
 * The app's pages, by address. The router (in `main.tsx`, or a test's) reads the address and draws the first
 * route that matches it. `:gameId` matches any one segment and hands it to the page; `*` matches anything left.
 */
export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        {/* Before /:gameId, which would match them too; defineGame keeps these ids from games (ADR 0021). */}
        <Route path="/games" element={<BrowsePage />} />
        <Route path="/:gameId" element={<SetupPage />} />
        <Route path="/:gameId/play" element={<PlayPage />} />
        <Route path="/:gameId/rules" element={<RulesPage />} />
        {/* After play and rules: a variant can't be called either (defineGame checks). */}
        <Route path="/:gameId/:variantId" element={<SetupPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
