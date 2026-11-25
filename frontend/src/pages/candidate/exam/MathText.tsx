import { mathSpans } from './mathSpans'

/** Plain text with its numbers and formulas in JetBrains Mono (D-061). */
export default function MathText({ text }: { text: string }) {
  return (
    <>
      {mathSpans(text).map((span, i) => (span.math ? <span key={i} className="font-mono">{span.text}</span> : span.text))}
    </>
  )
}
