import { useEffect, useEffectEvent } from 'react'
import type { MachineEvent } from '../../../machine/types'
import { Handoff } from '../../../interactions/Handoff'
import type { TeamTurnsConfig } from '../config'
import type { TeamTurnsViewProps } from './types'

/**
 * The format's default `handoff` view: pass the phone to the team whose turn it is. In Free Play (ADR 0019) there's
 * no one to pass it to, so it starts the turn by itself and shows nothing.
 */
export function HandoffView<Item, Turn, Event extends MachineEvent, Config extends TeamTurnsConfig>({
  context,
  send,
}: TeamTurnsViewProps<Item, Turn, Event, Config>) {
  const solo = context.config.solo === true
  const start = useEffectEvent(() => send({ type: 'start' }))
  useEffect(() => {
    if (solo) start()
  }, [solo])
  if (solo) return null
  return (
    <Handoff
      to={context.config.teams[context.current]}
      detail={`Round ${context.round} of ${context.config.rounds}`}
      onReady={() => send({ type: 'start' })}
    />
  )
}
