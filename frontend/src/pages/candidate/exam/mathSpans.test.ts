import { describe, expect, it } from 'vitest'
import { mathSpans } from './mathSpans'

// D-061: in the exam room only numbers and formulas are in JetBrains Mono, detected in plain text.
const marked = (text: string) => mathSpans(text).map((s) => (s.math ? `[${s.text}]` : s.text)).join('')

describe('mathSpans (D-061)', () => {
  it.each([
    ['Trei sferturi din numărul 48 reprezintă:', 'Trei sferturi din numărul [48] reprezintă:'],
    ['Numerele a și b sunt proporționale cu 3 și 5, iar a + b = 64. Numărul a este …', 'Numerele [a] și [b] sunt proporționale cu [3] și [5], iar [a + b = 64]. Numărul [a] este …'],
    ['În triunghiul ABC, AB = AC și ∢A = 40°.', 'În triunghiul [ABC], [AB = AC] și [∢A = 40°].'],
    ['b) Calculează aria lui. (10 puncte)', 'b) Calculează aria lui. ([10] puncte)'],
    ['o fracție e mai mare decât 3/4?', 'o fracție e mai mare decât [3/4]?'],
    ['Scrie 2,5 sau 2.5 ori −7.', 'Scrie [2,5] sau [2.5] ori [−7].'],
    ['Calculează 2(L + l) = 64', 'Calculează [2(L + l) = 64]'],
  ])('marks the maths in %j', (text, expected) => {
    expect(marked(text)).toBe(expected)
  })

  it('keeps line breaks and list markers at the start of a line', () => {
    expect(marked('Un pătrat are latura 4 cm.\na) Află perimetrul.\nb) Află aria.')).toBe('Un pătrat are latura [4] cm.\na) Află perimetrul.\nb) Află aria.')
  })

  it('leaves text without maths whole', () => {
    expect(mathSpans('se înjumătățesc')).toEqual([{ text: 'se înjumătățesc', math: false }])
  })
})
