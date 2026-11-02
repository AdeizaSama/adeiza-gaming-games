import { Button } from '../../ui/button'
import { parseMarkdown, type Block, type Span } from './markdown'

export interface InstructionProps {
  title: string
  /** What to explain, in the small part of markdown rules use (ADR 0009). */
  text: string
  /** The button's label. */
  actionLabel?: string
  /** Called when players have read it. */
  onAction: () => void
}

/**
 * Rules, or a step that needs explaining, with one button to carry on (standard §6). Fills the screen and scrolls;
 * the button stays in reach at the bottom.
 */
export function Instruction({ title, text, actionLabel = 'Got it', onAction }: InstructionProps) {
  return (
    <section className="flex flex-1 flex-col gap-6 p-6">
      <h2 className="text-4xl font-bold text-balance">{title}</h2>
      <Markdown text={text} />
      <div className="sticky bottom-0 mt-auto bg-background py-4">
        <Button size="lg" className="w-full" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </section>
  )
}

/**
 * Markdown from the supported subset, as elements. Never as an HTML string: text from a file can't add HTML to the
 * page (ADR 0009). Anything unsupported was already reported by `defineGame`; here it's shown as plain text.
 * Headings start one level below the `Instruction` title.
 */
export function Markdown({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-4 text-lg">
      {parseMarkdown(text).blocks.map((block, index) => (
        <MarkdownBlock key={index} block={block} />
      ))}
    </div>
  )
}

const headingStyles = { 1: 'text-2xl font-bold', 2: 'text-xl font-semibold', 3: 'font-semibold' } as const

function MarkdownBlock({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading': {
      const Heading = (['h3', 'h4', 'h5'] as const)[block.level - 1]
      return (
        <Heading className={`mt-2 ${headingStyles[block.level]}`}>
          <Spans spans={block.text} />
        </Heading>
      )
    }
    case 'paragraph':
      return (
        <p>
          <Spans spans={block.text} />
        </p>
      )
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul'
      return (
        <List className={`flex flex-col gap-2 pl-6 ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
          {block.items.map((item, index) => (
            <li key={index}>
              <Spans spans={item} />
            </li>
          ))}
        </List>
      )
    }
  }
}

function Spans({ spans }: { spans: Span[] }) {
  return spans.map((span, index) => (span.bold ? <strong key={index}>{span.text}</strong> : span.text))
}
