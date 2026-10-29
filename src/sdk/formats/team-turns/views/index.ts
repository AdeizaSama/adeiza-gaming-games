import { HandoffView } from './HandoffView'
import { ResultsView } from './ResultsView'
import { TurnSummaryView } from './TurnSummaryView'

/** The format's default view for each of its phases (ADR 0005). `defineGame` uses them unless a game lists its own. */
export const teamTurnsViews = {
  handoff: HandoffView,
  turn_summary: TurnSummaryView,
  results: ResultsView,
}

export { nextLabel } from './TurnSummaryView'
export type { TeamTurnsView, TeamTurnsViewProps } from './types'
