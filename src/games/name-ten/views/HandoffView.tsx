import type { TeamTurnsViewProps } from '../../../sdk/formats/team-turns/views'
import { Handoff } from '../../../sdk/interactions/Handoff'
import type { NameTenConfig } from '../config'
import type { NameTenEvent, NameTenTurn } from '../machine'
import type { NameTenItem } from '../schema'

/** The team that judges a turn: the next one in playing order, so the first team judges the last (ADR 0012). */
export function judgeOf(teams: readonly string[], current: number): string {
  return teams[(current + 1) % teams.length]
}

/**
 * Name Ten's handoff, replacing the format's: the judge's board shows the answers, so the phone goes to a judge from
 * another team, not to the team playing (ADR 0012).
 */
export function HandoffView({ context, send }: TeamTurnsViewProps<NameTenItem, NameTenTurn, NameTenEvent, NameTenConfig>) {
  const { teams, rounds } = context.config
  return (
    <Handoff
      lead="Hand the phone to a judge from"
      to={judgeOf(teams, context.current)}
      detail={`${teams[context.current]} are up · Round ${context.round} of ${rounds}`}
      onReady={() => send({ type: 'start' })}
    />
  )
}
