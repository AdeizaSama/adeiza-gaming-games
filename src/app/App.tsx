import { Route, Routes } from 'react-router'
import { LibraryPage } from './library/LibraryPage'
import { NotFoundPage } from './NotFoundPage'
import { PlayPage } from './play/PlayPage'
import { RulesPage } from './rules/RulesPage'
import { SetupPage } from './setup/SetupPage'

/**
 * The app's pages, by address. The router (in `main.tsx`, or a test's) reads the address and draws the first
 * route that matches it. `:gameId` matches any one segment and hands it to the page; `*` matches anything left.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LibraryPage />} />
      <Route path="/:gameId" element={<SetupPage />} />
      <Route path="/:gameId/play" element={<PlayPage />} />
      <Route path="/:gameId/rules" element={<RulesPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
