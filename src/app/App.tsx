import { Route, Routes } from 'react-router'
import { GamePage } from './GamePage'
import { LibraryPage } from './library/LibraryPage'
import { NotFoundPage } from './NotFoundPage'

/**
 * The app's pages, by address. The router (in `main.tsx`, or a test's) reads the address and draws the first
 * route that matches it. `:gameId` matches any one segment and hands it to the page; `*` matches anything left.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LibraryPage />} />
      <Route path="/:gameId" element={<GamePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
