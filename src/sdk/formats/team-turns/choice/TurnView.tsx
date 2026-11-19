import { useEffect, useEffectEvent } from 'react'
import { Button } from '../../../../ui/button'
import { Countdown } from '../../../interactions/Countdown'
import { MultipleChoice } from '../../../interactions/MultipleChoice'
import type { TeamTurnsViewProps } from '../views'
import type { ChoiceConfig } from './config'
import { moreToCome, type ChoiceEvent, type ChoiceItem, type ChoiceTurn } from './machine'

/** Against the clock, how long a result shows before the next question comes up by itself (ADR 0015, 0017). */
export const autoNextMs = 750

/** Which question this is: "Question 2 of 5" for a set number, "Question 2" against the clock, nothing for one. */
export function questionCount(turn: ChoiceTurn, config: ChoiceConfig): string | null {
  const number = turn.results.length + (turn.picked === null ? 1 : 0)
  if (config.mode === 'clock') return `Question ${number}`
  return config.questions > 1 ? `Question ${number} of ${config.questions}` : null
}

/**
 * A multiple-choice turn (ADR 0017), on the team's phone, for both of its phases: the question, and its result once picked. The
 * team and the clock at the top; after a pick, a button to the next question or the end of the turn.
 *
 * The clock is hidden on the result of a turn's last question: time running out then would cut the result short,
 * and there's nothing left to answer.
 *
 * Against the clock, the result shows for `autoNextMs` and the next question fades in by itself: no button, so the
 * team keeps its eyes on the questions. In a set of questions, the team taps to go on.
 *
 * A game makes its view with its item type and the label above the question:
 *
 *   views: { turn: choiceTurnView<TriviaItem>(), reveal: … } // the same view for both phases
 */
export function choiceTurnView<Item extends ChoiceItem>(label = 'Question') {
  return function ChoiceTurnView({ context, send }: TeamTurnsViewProps<Item, ChoiceTurn, ChoiceEvent, ChoiceConfig>) {
    const { turn, config, item } = context
    const answered = turn.picked !== null
    const more = moreToCome(turn, config)
    const count = questionCount(turn, config)
    const auto = config.mode === 'clock'

    // An effect event always sends with the latest `send`, without restarting the wait when the parent re-renders.
    const next = useEffectEvent(() => send({ type: 'continue' }))
    useEffect(() => {
      if (!answered || !auto) return
      const timer = setTimeout(next, autoNextMs)
      return () => clearTimeout(timer)
    }, [answered, auto])

    const showButton = answered && !auto
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
          // A new key for each question, so each one fades in. Its result keeps the key, so only a new question fades.
          <div key={count ?? 1} className="flex min-h-0 flex-1 flex-col animate-fade-in motion-reduce:animate-none">
            <MultipleChoice
              label={label}
              question={item.question}
              subtitle={item.subtitle}
              options={turn.options}
              answer={turn.options.indexOf(item.answer)}
              picked={turn.picked}
              onPick={(index) => send({ type: 'answer', index })}
            />
          </div>
        )}
        {/* Kept in place while the question is open, so the card doesn't jump when it appears. Never shown against the
            clock: the next question comes by itself. */}
        <Button className={showButton ? undefined : 'invisible'} aria-hidden={!showButton} tabIndex={showButton ? 0 : -1} onClick={() => send({ type: 'continue' })}>
          {more ? 'Next question' : 'End turn'}
        </Button>
      </section>
    )
  }
}
