import { useState } from 'react'
import { Button } from '../../ui/button'
import { cn } from '../../ui/cn'

export interface ReviewRow {
  /** What was played, e.g. "Gala". */
  text: string
  /** A detail under it, e.g. "Acted". */
  detail?: string
  /** Its result, e.g. "Got it" or "Skipped". */
  result: string
  /** How the result reads, which picks its color: it scored, it cost, or neither. */
  tone: 'good' | 'bad' | 'none'
  /** True when the host has changed this result. */
  changed?: boolean
}

export interface ReviewProps {
  /** Whose turn it was, e.g. a team name. */
  title: string
  /** Everything played in the turn, in order. */
  rows: ReviewRow[]
  /** The host tapped a row to change its result. Only possible after Adjust. */
  onToggle: (index: number) => void
  onDone: () => void
  doneLabel?: string
}

const tones = {
  good: 'bg-success text-success-foreground',
  bad: 'bg-destructive text-destructive-foreground',
  none: 'bg-muted text-muted-foreground',
}

/**
 * The turn, card by card, before its points count (standard §6, ADR 0007). Results are locked until the host taps
 * Adjust, so a tap while the phone goes round changes nothing. Being unlocked is this screen's own state: it isn't
 * saved, so a refresh locks it again. What a tap changes is up to the game, through `onToggle`.
 */
export function Review({ title, rows, onToggle, onDone, doneLabel = 'Done' }: ReviewProps) {
  const [unlocked, setUnlocked] = useState(false)
  return (
    <section className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex flex-col items-center gap-2 pt-4 text-center">
        <h2 className="text-4xl font-bold text-balance">{title}</h2>
        <p className="text-muted-foreground">{unlocked ? 'Tap a card to change its result.' : 'Check the cards before they count.'}</p>
      </header>
      {rows.length === 0 ? (
        <p className="flex-1 text-center text-muted-foreground">Nothing was played this turn.</p>
      ) : (
        <ul aria-label="Cards this turn" className="flex flex-1 flex-col gap-2">
          {rows.map((row, index) => {
            const content = (
              <>
                <span className="flex flex-col">
                  <span className="font-semibold">{row.text}</span>
                  {row.detail && <span className="text-sm text-muted-foreground">{row.detail}</span>}
                </span>
                <span className="flex flex-col items-end gap-1">
                  <span className={cn('rounded-md px-2 py-0.5 text-sm font-semibold', tones[row.tone])}>{row.result}</span>
                  {row.changed && <span className="text-xs text-muted-foreground">changed</span>}
                </span>
              </>
            )
            const rowClass = 'flex w-full items-center justify-between gap-4 rounded-md bg-card p-3 text-left text-card-foreground'
            return (
              <li key={index}>
                {unlocked ? (
                  <button type="button" className={cn(rowClass, 'ring-1 ring-border active:bg-secondary')} onClick={() => onToggle(index)}>
                    {content}
                  </button>
                ) : (
                  <div className={rowClass}>{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-4">
        {rows.length > 0 ? (
          <Button size="lg" variant="outline" onClick={() => setUnlocked(!unlocked)}>
            {unlocked ? 'Lock' : 'Adjust'}
          </Button>
        ) : (
          <span />
        )}
        <Button size="lg" onClick={onDone}>
          {doneLabel}
        </Button>
      </div>
    </section>
  )
}
