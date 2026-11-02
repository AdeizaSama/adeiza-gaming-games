/** A run of text inside a block, bold or not. */
export interface Span {
  text: string
  bold: boolean
}

/** One block of the small part of markdown we support (ADR 0009). */
export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: Span[] }
  | { type: 'paragraph'; text: Span[] }
  | { type: 'list'; ordered: boolean; items: Span[][] }

export interface ParsedMarkdown {
  blocks: Block[]
  /** What the text uses that we don't support, one message per problem, each starting with its line number. */
  problems: string[]
}

/** Lines that start a construct we don't support, and what to do instead. */
const unsupportedLines: [RegExp, string][] = [
  [/^\s+\S/, 'indented lines (nested lists, code) aren’t supported; start the line at the left edge'],
  [/^#{4,}\s/, 'only #, ## and ### headings are supported'],
  [/^#+[^#\s]/, 'put a space after the # of a heading'],
  [/^>/, 'quotes aren’t supported'],
  [/^(```|~~~)/, 'code blocks aren’t supported'],
  [/^\|/, 'tables aren’t supported; use a list'],
  [/^[*+]\s/, 'start list items with "- "'],
  [/^(-{3,}|\*{3,}|_{3,})\s*$/, 'dividers aren’t supported; use a heading'],
  [/^</, 'HTML isn’t supported'],
]

/** Things inside a line we don't support, and what to do instead. */
const unsupportedText: [RegExp, string][] = [
  [/!\[/, 'images aren’t supported'],
  [/\[[^\]]*\]\(/, 'links aren’t supported; write the address as text'],
  [/`/, 'code isn’t supported'],
  [/<[a-z/!]/i, 'HTML isn’t supported'],
  [/(^|[^*])\*(?!\*)/, 'italics aren’t supported; use **bold**'],
  [/(^|\s)_[^\s_]|[^\s_]_(\s|[.,;:!?]|$)/, 'italics aren’t supported; use **bold**'],
]

/**
 * Parses the small part of markdown that rules use (ADR 0009): `#`, `##` and `###` headings, paragraphs, `- ` and
 * `1. ` lists, and `**bold**`. Anything else is reported in `problems`, with its line number, instead of being shown
 * as raw symbols. The text is never turned into HTML: views render the blocks as elements.
 */
export function parseMarkdown(markdown: string): ParsedMarkdown {
  const blocks: Block[] = []
  const problems: string[] = []
  // The paragraph or list being built, so the next line can join it.
  let open: { type: 'paragraph'; lines: string[] } | { type: 'list'; ordered: boolean; items: string[][] } | undefined
  let openLine = 0

  const close = () => {
    if (open?.type === 'paragraph') blocks.push({ type: 'paragraph', text: spans(open.lines.join(' '), openLine, problems) })
    if (open?.type === 'list') {
      const list = open
      blocks.push({ type: 'list', ordered: list.ordered, items: list.items.map((lines) => spans(lines.join(' '), openLine, problems)) })
    }
    open = undefined
  }

  markdown.split(/\r?\n/).forEach((raw, index) => {
    const line = index + 1
    const text = raw.trimEnd()
    if (text === '') return close()

    const unsupported = unsupportedLines.find(([pattern]) => pattern.test(text))
    if (unsupported) {
      problems.push(`Line ${line}: ${unsupported[1]}`)
      return
    }
    for (const [pattern, message] of unsupportedText) {
      if (pattern.test(text)) problems.push(`Line ${line}: ${message}`)
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(text)
    if (heading) {
      close()
      blocks.push({ type: 'heading', level: heading[1].length as 1 | 2 | 3, text: spans(heading[2], line, problems) })
      return
    }

    const item = /^(-|\d+\.)\s+(.*)$/.exec(text)
    if (item) {
      const ordered = item[1] !== '-'
      if (open?.type !== 'list' || open.ordered !== ordered) {
        close()
        open = { type: 'list', ordered, items: [] }
        openLine = line
      }
      open.items.push([item[2]])
      return
    }

    // Plain text: carries on the paragraph, or the last list item, it follows.
    if (open?.type === 'list') open.items[open.items.length - 1].push(text)
    else if (open?.type === 'paragraph') open.lines.push(text)
    else {
      open = { type: 'paragraph', lines: [text] }
      openLine = line
    }
  })
  close()

  return { blocks, problems }
}

/** Splits a block's text into plain and bold runs. `line` is where the block starts, for an unclosed `**`. */
function spans(text: string, line: number, problems: string[]): Span[] {
  const parts = text.split('**')
  if (parts.length % 2 === 0) {
    problems.push(`Line ${line}: a ** is never closed`)
    return [{ text, bold: false }]
  }
  return parts.map((part, index) => ({ text: part, bold: index % 2 === 1 })).filter((span) => span.text !== '')
}
