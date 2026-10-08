import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { friendlyError } from './messages'

// A stand-in schema with one field of each kind the messages cover.
const Example = z.strictObject({
  name: z.string().min(1),
  code: z.string().min(3),
  text: z.string().max(5),
  count: z.number(),
  level: z.enum(['everyone', 'teen', 'adult']),
  tags: z.array(z.string()).min(1),
  pair: z.array(z.string()).min(2),
  custom: z.array(z.string()).min(1, 'Written by the schema'),
})

const valid = { name: 'a', code: 'abc', text: 'hi', count: 1, level: 'teen', tags: ['x'], pair: ['x', 'y'], custom: ['x'] }

/** The message for the first problem in `valid` with some fields changed. */
function messageFor(changes: Record<string, unknown>): string | undefined {
  return Example.safeParse({ ...valid, ...changes }, { error: friendlyError }).error?.issues[0].message
}

describe('friendlyError', () => {
  it('says a field is missing', () => {
    expect(messageFor({ name: undefined })).toBe('"name" is missing')
  })

  it('names the expected kind of value and what was found', () => {
    expect(messageFor({ count: 'seven' })).toBe('"count" should be a number, found "seven"')
    expect(messageFor({ name: 7 })).toBe('"name" should be text in quotes, found 7')
    expect(messageFor({ tags: 'x' })).toBe('"tags" should be a list in [ ], found "x"')
  })

  it('names unknown fields and suggests a fix', () => {
    expect(messageFor({ maturty: 'teen' })).toBe('Unknown field "maturty": check the spelling, or remove it')
  })

  it('lists the allowed values', () => {
    expect(messageFor({ level: 'kids' })).toBe('"level" must be one of "everyone", "teen", "adult"')
  })

  it('says a field with a fixed list of values is missing, rather than wrong', () => {
    expect(messageFor({ level: undefined })).toBe('"level" is missing')
  })

  it('names the list when an entry in it is wrong', () => {
    const Modes = z.strictObject({ modes: z.array(z.enum(['describe', 'act'])) })
    const result = Modes.safeParse({ modes: ['act', 'mime'] }, { error: friendlyError })
    expect(result.error?.issues[0].message).toBe('Each entry in "modes" must be one of "describe", "act"')
  })

  it('says text is empty, too short or too long', () => {
    expect(messageFor({ name: '' })).toBe(`"name" can't be empty`)
    expect(messageFor({ code: 'ab' })).toBe('"code" needs at least 3 characters')
    expect(messageFor({ text: 'too long' })).toBe('"text" is too long: at most 5 characters')
  })

  it('says how many entries a list needs', () => {
    expect(messageFor({ tags: [] })).toBe('"tags" needs at least 1 entry')
    expect(messageFor({ pair: ['x'] })).toBe('"pair" needs at least 2 entries')
  })

  it("keeps a message the schema wrote itself", () => {
    expect(messageFor({ custom: [] })).toBe('Written by the schema')
  })

  it('names the item, not its position, for a problem inside a list', () => {
    const List = z.strictObject({ items: z.array(z.strictObject({ text: z.string() })) })
    const result = List.safeParse({ items: [{ text: 'ok' }, {}] }, { error: friendlyError })
    expect(result.error?.issues[0].message).toBe('"text" is missing')
  })
})
