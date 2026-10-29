import type { ComponentType } from 'react'
import type { MachineEvent } from '../../../machine/types'
import type { TeamTurnsConfig } from '../config'
import type { TeamTurnsContext } from '../rules'
import type { TeamTurnsEvent } from '../teamTurns'

/** What every team-turns view receives (ADR 0005). */
export interface TeamTurnsViewProps<Item, Turn, Event extends MachineEvent, Config extends TeamTurnsConfig = TeamTurnsConfig> {
  /** The game's data, to show. */
  context: TeamTurnsContext<Item, Turn, Config>
  /** Reports what the players did. The view never changes the game itself. */
  send: (event: Event | TeamTurnsEvent) => void
  /** What a turn's record is worth: the game's scoring. */
  points: (turn: Turn) => number
}

/** A view for one phase of a team-turns game. */
export type TeamTurnsView<Item, Turn, Event extends MachineEvent, Config extends TeamTurnsConfig = TeamTurnsConfig> =
  ComponentType<TeamTurnsViewProps<Item, Turn, Event, Config>>
