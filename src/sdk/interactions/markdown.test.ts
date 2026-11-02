import { describe, expect, it } from 'vitest'
import { parseMarkdown } from './markdown'

const plain = (text: string) => ({ text, bold: false })
const bold = (text: string) => ({ text, bold: true })

describe('parseMarkdown', () => {
  it('reads headings, paragraphs, both kinds of list and bold', () => {
    const text = [
      '# Charades',
      '',
      'Act it out.',
      'Beat the **clock**.',
      '',
      '## A turn',
      '1. Start',
      '2. **Got it** or Skip',
      '',
      '- Be loud',
      '- Be quick',
    ].join('\n')

    expect(parseMarkdown(text)).toEqual({
      blocks: [
        { type: 'heading', level: 1, text: [plain('Charades')] },
        { type: 'paragraph', text: [plain('Act it out. Beat the '), bold('clock'), plain('.')] },
        { type: 'heading', level: 2, text: [plain('A turn')] },
        { type: 'list', ordered: true, items: [[plain('Start')], [bold('Got it'), plain(' or Skip')]] },
        { type: 'list', ordered: false, items: [[plain('Be loud')], [plain('Be quick')]] },
      ],
      problems: [],
    })
  })

  it('carries a list item on to the next line, starts a new list when the kind changes, and ends a paragraph at a heading', () => {
    const { blocks, problems } = parseMarkdown('- One\ncarried on\n1. Two\nText\n### Next\r\nMore')
    expect(problems).toEqual([])
    expect(blocks).toEqual([
      { type: 'list', ordered: false, items: [[plain('One carried on')]] },
      { type: 'list', ordered: true, items: [[plain('Two Text')]] },
      { type: 'heading', level: 3, text: [plain('Next')] },
      { type: 'paragraph', text: [plain('More')] },
    ])
  })

  it('reports every line that starts something unsupported, with its line number', () => {
    const lines = ['| a | b |', '> quote', '```', '* item', '#### Deep', '#Title', '  indented', '---', '<div>']
    expect(parseMarkdown(lines.join('\n')).problems).toEqual([
      'Line 1: tables aren’t supported; use a list',
      'Line 2: quotes aren’t supported',
      'Line 3: code blocks aren’t supported',
      'Line 4: start list items with "- "',
      'Line 5: only #, ## and ### headings are supported',
      'Line 6: put a space after the # of a heading',
      'Line 7: indented lines (nested lists, code) aren’t supported; start the line at the left edge',
      'Line 8: dividers aren’t supported; use a heading',
      'Line 9: HTML isn’t supported',
    ])
  })

  it('reports unsupported text inside a line on that line, and an unclosed ** where its block starts', () => {
    const text = ['Fine,', 'see [the site](https://example.com)', '![a picture](a.png)', 'type `got`', 'an *aside*', 'an _aside_', 'a <b>tag</b>', '', '- **never closed'].join('\n')
    expect(parseMarkdown(text).problems).toEqual([
      'Line 2: links aren’t supported; write the address as text',
      'Line 3: images aren’t supported',
      'Line 3: links aren’t supported; write the address as text',
      'Line 4: code isn’t supported',
      'Line 5: italics aren’t supported; use **bold**',
      'Line 6: italics aren’t supported; use **bold**',
      'Line 7: HTML isn’t supported',
      'Line 9: a ** is never closed',
    ])
  })

  it('leaves ordinary text alone', () => {
    expect(parseMarkdown('Score 5 < 10, a snake_case word, and it’s **fine**.\n\n- 3 rounds — 60 seconds').problems).toEqual([])
    expect(parseMarkdown('').blocks).toEqual([])
  })
})
