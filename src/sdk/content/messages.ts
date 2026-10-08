import type { z } from 'zod'

/** What zod calls each JSON type, in words a contributor would use. */
const typeNames: Record<string, string> = {
  string: 'text in quotes',
  number: 'a number',
  boolean: 'true or false',
  array: 'a list in [ ]',
  object: 'an object in { }',
}

/** Describes a value a contributor wrote, for "found …" in a message. */
function describe(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'a list'
  if (typeof value === 'object') return 'an object'
  if (typeof value === 'string') return `"${value}"`
  return String(value)
}

/**
 * Rewrites zod's messages for people who edit pack files and may never have coded. Passed to `safeParse` as
 * `{ error: friendlyError }`. Messages a schema writes itself (e.g. 'List at least one contributor') take priority
 * over this; it only replaces zod's built-in ones, like "Too small: expected string to have >=1 characters".
 *
 * Returning undefined keeps zod's message, for anything not covered here.
 */
export const friendlyError: z.core.$ZodErrorMap = (issue) => {
  // What the message is about: a field (`"maturity"`), or an entry in a list (`Each entry in "modes"`).
  const last = issue.path?.at(-1)
  const beforeLast = issue.path?.at(-2)
  const name =
    typeof last === 'string'
      ? `"${last}"`
      : typeof last === 'number' && typeof beforeLast === 'string'
        ? `Each entry in "${beforeLast}"`
        : 'This'

  // A field that isn't there at all. zod reports it as the wrong type, or for a fixed list of values as a wrong value.
  if ((issue.code === 'invalid_type' || issue.code === 'invalid_value') && issue.input === undefined) {
    return `${name} is missing`
  }

  switch (issue.code) {
    case 'invalid_type':
      return `${name} should be ${typeNames[issue.expected] ?? issue.expected}, found ${describe(issue.input)}`
    case 'unrecognized_keys':
      return `Unknown field${issue.keys.length > 1 ? 's' : ''} ${issue.keys.map((key) => `"${key}"`).join(', ')}: check the spelling, or remove it`
    case 'invalid_value':
      return `${name} must be one of ${issue.values.map((value) => `"${String(value)}"`).join(', ')}`
    case 'too_small':
      if (issue.origin === 'string' && Number(issue.minimum) === 1) return `${name} can't be empty`
      if (issue.origin === 'string') return `${name} needs at least ${issue.minimum} characters`
      if (issue.origin === 'array') return `${name} needs at least ${issue.minimum} entr${Number(issue.minimum) === 1 ? 'y' : 'ies'}`
      return undefined
    case 'too_big':
      if (issue.origin === 'string') return `${name} is too long: at most ${issue.maximum} characters`
      return undefined
    default:
      return undefined
  }
}
