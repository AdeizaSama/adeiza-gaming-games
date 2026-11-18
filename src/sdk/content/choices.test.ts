import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createRng } from '../rng'
import { checkAnswer, Options, orderOptions } from './choices'

// A question shaped like Trivia Night's, to test checkAnswer on a whole item.
const Question = z.strictObject({ question: z.string(), options: Options, answer: z.string() }).superRefine(checkAnswer)

/** Where each problem is, e.g. `options.2`. */
const problems = (result: { success: boolean; error?: z.ZodError }) => result.error?.issues.map((issue) => issue.path.join('.')) ?? []

describe('Options', () => {
  it('takes 2 to 5 options, and refuses 1 or 6', () => {
    expect(Options.safeParse(['Yes', 'No']).success).toBe(true)
    expect(Options.safeParse(['A', 'B', 'C', 'D', 'E']).success).toBe(true)
    expect(Options.safeParse(['Yes']).success).toBe(false)
    expect(Options.safeParse(['A', 'B', 'C', 'D', 'E', 'F']).success).toBe(false)
  })

  it('refuses an empty option, one over 80 characters, and a repeat that differs only in capitals', () => {
    expect(problems(Options.safeParse(['Lagos', ' ']))).toEqual(['1'])
    expect(problems(Options.safeParse(['Lagos', 'x'.repeat(81)]))).toEqual(['1'])
    expect(problems(Options.safeParse(['Lagos', 'Abuja', 'LAGOS']))).toEqual(['2'])
  })
})

describe('checkAnswer', () => {
  it('passes an answer that is one of the options, and refuses one that isn’t or is written differently', () => {
    expect(Question.safeParse({ question: 'Capital?', options: ['Lagos', 'Abuja'], answer: 'Abuja' }).success).toBe(true)
    expect(problems(Question.safeParse({ question: 'Capital?', options: ['Lagos', 'Abuja'], answer: 'Kano' }))).toEqual(['answer'])
    expect(problems(Question.safeParse({ question: 'Capital?', options: ['Lagos', 'Abuja'], answer: 'abuja' }))).toEqual(['answer'])
  })
})

describe('orderOptions', () => {
  const options = ['Year 10', 'banana', 'Year 9', 'Apple', '12', '8']

  it('shuffle: a new order from the machine’s random numbers, the same for the same seed, the original unchanged', () => {
    const before = [...options]
    const shuffled = orderOptions(options, 'shuffle', createRng(7))
    expect([...shuffled].sort()).toEqual([...options].sort())
    expect(orderOptions(options, 'shuffle', createRng(7))).toEqual(shuffled)
    expect(options).toEqual(before)
  })

  it('alphabetical: A to Z ignoring capitals, numbers in number order', () => {
    expect(orderOptions(options, 'alphabetical', createRng(7))).toEqual(['8', '12', 'Apple', 'banana', 'Year 9', 'Year 10'])
  })
})
