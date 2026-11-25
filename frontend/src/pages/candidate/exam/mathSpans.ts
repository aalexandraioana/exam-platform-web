// D-061: statements are plain text; in the exam room only numbers and formulas are shown in
// JetBrains Mono. A piece is maths when it has a digit or a maths symbol, is an operator, or is a
// variable or point name (one letter other than the words "o" and "e", or 2–4 capitals). Maths
// pieces next to each other join into one span; words and trailing punctuation stay text.
export interface MathSpan {
  text: string
  math: boolean
}

const SYMBOL = /[0-9∢°²³·≤≥≠−+=/×÷√π<>%]/u
const OPERATORS = new Set(['+', '−', '-', '=', ':', '·', '×', '÷', '<', '>', '≤', '≥', '≠', '/'])

function isMath(core: string): boolean {
  if (!core) return false
  if (OPERATORS.has(core) || SYMBOL.test(core)) return true
  if (/^[A-Za-z]$/.test(core)) return core !== 'o' && core !== 'e'
  return /^[A-Z]{2,4}$/.test(core)
}

/** "(10" → "(", "10", ""; "l)" → "", "l)", ""; "64." → "", "64", ".". */
function split(token: string): [string, string, string] {
  const match = /^(\(?)(.*?)([.,;!?…]*\)?[.,;!?…]*)$/u.exec(token)!
  let [, lead, core, trail] = match
  if (lead && core.includes(')')) {
    core = lead + core
    lead = ''
  }
  if (trail.startsWith(')') && !lead && (core.includes('(') || isMath(core))) {
    core += ')'
    trail = trail.slice(1)
  }
  return [lead, core, trail]
}

export function mathSpans(text: string): MathSpan[] {
  const pieces: Array<{ text: string; math: boolean | null }> = []
  text.split('\n').forEach((line, index) => {
    if (index > 0) pieces.push({ text: '\n', math: false })
    const parts = line.split(/( +)/).filter((part) => part !== '')
    const first = parts.findIndex((part) => part.trim() !== '')
    parts.forEach((part, i) => {
      if (part.trim() === '') return void pieces.push({ text: part, math: null })
      // A list marker such as "b)" at the start of a line is text.
      if (i === first && /^[a-z]\)$/.test(part)) return void pieces.push({ text: part, math: false })
      const [lead, core, trail] = split(part)
      if (lead) pieces.push({ text: lead, math: false })
      if (core) pieces.push({ text: core, math: isMath(core) || isMath(core.replace(/[()]/g, '')) })
      if (trail) pieces.push({ text: trail, math: false })
    })
  })

  const spans: MathSpan[] = []
  pieces.forEach((piece, i) => {
    const math = piece.math ?? Boolean(pieces[i - 1]?.math && pieces[i + 1]?.math)
    const last = spans[spans.length - 1]
    if (last && last.math === math) last.text += piece.text
    else spans.push({ text: piece.text, math })
  })
  return spans
}
