import type { MachineEvent } from '../../../machine/types'
import { Handoff } from '../../../interactions/Handoff'
import type { TeamTurnsConfig } from '../config'
import type { TeamTurnsViewProps } from './types'

/** The format's default `handoff` view: pass the phone to the team whose turn it is. */
export function HandoffView<Item, Turn, Event extends MachineEvent, Config extends TeamTurnsConfig>({
  context,
  send,
}: TeamTurnsViewProps<Item, Turn, Event, Config>) {
  return (
    <Handoff
      to={context.config.teams[context.current]}
      detail={`Round ${context.round} of ${context.config.rounds}`}
      onReady={() => send({ type: 'start' })}
    />
  )
}
