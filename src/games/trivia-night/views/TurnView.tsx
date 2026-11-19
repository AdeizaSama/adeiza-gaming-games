import type { TeamTurnsViewProps } from '../../../sdk/formats/team-turns/views'
import { Countdown } from '../../../sdk/interactions/Countdown'
import { MultipleChoice } from '../../../sdk/interactions/MultipleChoice'
import { Button } from '../../../ui/button'
import type { TriviaConfig } from '../config'
import { moreToCome, type TriviaEvent, type TriviaTurn } from '../machine'
import type { TriviaItem } from '../schema'

/** Which question this is: "Question 2 of 5" for a set number, "Question 2" against the clock, nothing for one. */
export function questionCount(turn: TriviaTurn, config: TriviaConfig): string | null {
  const number = turn.results.length + (turn.picked === null ? 1 : 0)
  if (config.mode === 'clock') return `Question ${number}`
  return config.questions > 1 ? `Question ${number} of ${config.questions}` : null
}

/**
 * A Trivia Night turn, on the team's phone, for both of its phases: the question, and its result once picked. The
 * team and the clock at the top; after a pick, a button to the next question or the end of the turn.
 *
 * The clock is hidden on the result of a turn's last question: time running out then would cut the result short,
 * and there's nothing left to answer.
 */
export function TurnView({ context, send }: TeamTurnsViewProps<TriviaItem, TriviaTurn, TriviaEvent, TriviaConfig>) {
  const { turn, config, item } = context
  const answered = turn.picked !== null
  const more = moreToCome(turn, config)
  const count = questionCount(turn, config)
  return (
    // min-h-0: the card fills the play screen's height and no more (ADR 0013).
    <section className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xl font-semibold">{config.teams[context.current]}</p>
          {count && <p className="text-sm text-muted-foreground">{count}</p>}
        </div>
        {context.turnEndsAt !== null && (more || !answered) && <Countdown endsAt={context.turnEndsAt} onTimeUp={() => send({ type: 'time_up' })} />}
      </header>
      {item && (
        <MultipleChoice
          question={item.question}
          subtitle={item.subtitle}
          options={turn.options}
          answer={turn.options.indexOf(item.answer)}
          picked={turn.picked}
          onPick={(index) => send({ type: 'answer', index })}
        />
      )}
      {/* Kept in place while the question is open, so the card doesn't jump when it appears. */}
      <Button className={answered ? undefined : 'invisible'} aria-hidden={!answered} tabIndex={answered ? 0 : -1} onClick={() => send({ type: 'continue' })}>
        {more ? 'Next question' : 'End turn'}
      </Button>
    </section>
  )
}
