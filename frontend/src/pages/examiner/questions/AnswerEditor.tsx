import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { checkAnswer, type AnswerKey, type QuestionType } from '../../../api/questions'
import Alert from '../../../components/Alert'
import Button from '../../../components/Button'
import TextField from '../../../components/TextField'
import { letter } from './problems'
import { ghostClass, inputClass, Segmented } from './ui'

interface Props {
  type: QuestionType
  value: AnswerKey
  onChange: (key: AnswerKey) => void
  /** Named values are on: the short answer is a number from the answer formula (D-057, Q-051). */
  hasValues: boolean
  /** The answer of the first sample draw, for "Testează un răspuns". */
  sampleAnswer: number | null
}

// DS-007: the correct answer for each Subject I type (D-017, D-005, D-045).
export default function AnswerEditor({ type, value, onChange, hasValues, sampleAnswer }: Props) {
  const { t } = useTranslation()
  if (type === 'dual_choice') {
    return (
      <fieldset className="grid gap-2">
        <legend className="mb-2 font-medium">{t('bank.dualIs')}</legend>
        <div>
          <Segmented
            label={t('bank.dualIs')}
            value={value.correct === false ? 'false' : 'true'}
            options={[{ value: 'true', label: t('bank.dualTrue') }, { value: 'false', label: t('bank.dualFalse') }]}
            onChange={(v) => onChange({ correct: v === 'true' })}
          />
        </div>
        <span className="text-caption text-secondary">{t('bank.dualHelp')}</span>
      </fieldset>
    )
  }
  if (type === 'single_choice' || type === 'multiple_choice') return <Options type={type} value={value} onChange={onChange} />
  if (type === 'short_answer') return <ShortAnswer value={value} onChange={onChange} hasValues={hasValues} sampleAnswer={sampleAnswer} />
  return null
}

function Options({ type, value, onChange }: { type: 'single_choice' | 'multiple_choice'; value: AnswerKey; onChange: (key: AnswerKey) => void }) {
  const { t } = useTranslation()
  const options = value.options ?? []
  const multiple = type === 'multiple_choice'
  const correct = multiple ? ((value.correct as number[] | undefined) ?? []) : [value.correct as number]

  function toggle(position: number) {
    if (!multiple) return onChange({ ...value, correct: position })
    const next = correct.includes(position) ? correct.filter((p) => p !== position) : [...correct, position].sort((a, b) => a - b)
    onChange({ ...value, correct: next })
  }

  function remove(index: number) {
    const position = index + 1
    const shift = (p: number) => (p > position ? p - 1 : p)
    const nextOptions = options.filter((_, i) => i !== index)
    const nextCorrect = multiple ? correct.filter((p) => p !== position).map(shift) : correct[0] === position ? 1 : shift(correct[0])
    onChange({ ...value, options: nextOptions, correct: nextCorrect })
  }

  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 font-medium">{t('bank.options')}</legend>
      {options.map((option, index) => (
        <div key={index} className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2">
          <input
            type={multiple ? 'checkbox' : 'radio'}
            name="correct-option"
            checked={correct.includes(index + 1)}
            onChange={() => toggle(index + 1)}
            aria-label={t('bank.optionCorrect', { letter: letter(index) })}
            className="size-icon-md accent-[var(--bg-primary)]"
          />
          <span className="text-caption text-secondary">{letter(index)})</span>
          <input
            className={`${inputClass} font-mono`}
            aria-label={t('bank.optionLabel', { letter: letter(index) })}
            value={option}
            onChange={(e) => onChange({ ...value, options: options.map((o, i) => (i === index ? e.target.value : o)) })}
          />
          <Button iconOnly aria-label={t('bank.removeOption', { letter: letter(index) })} onClick={() => remove(index)} disabled={options.length <= 2}>
            <X className="size-icon-md" aria-hidden="true" />
          </Button>
        </div>
      ))}
      <button type="button" className={`${ghostClass} justify-self-start`} onClick={() => onChange({ ...value, options: [...options, ''] })} disabled={options.length >= 10}>
        {t('bank.addOption')}
      </button>
      <span className="text-caption text-secondary">{t(multiple ? 'bank.multiHelp' : 'bank.singleHelp')}</span>
    </fieldset>
  )
}

function ShortAnswer({ value, onChange, hasValues, sampleAnswer }: { value: AnswerKey; onChange: (key: AnswerKey) => void; hasValues: boolean; sampleAnswer: number | null }) {
  const { t } = useTranslation()
  const kind = value.kind ?? 'text'
  const accepted = value.accepted ?? ['']

  return (
    <div className="grid gap-4">
      {!hasValues && (
        <fieldset className="grid gap-2">
          <legend className="mb-2 font-medium">{t('bank.answerIs')}</legend>
          <div>
            <Segmented
              label={t('bank.answerIs')}
              value={kind}
              options={[
                { value: 'text', label: t('bank.kindText') },
                { value: 'number', label: t('bank.kindNumber') },
                { value: 'fraction', label: t('bank.kindFraction') },
              ]}
              onChange={(k) => onChange(k === 'text' ? { kind: 'text', accepted: [''] } : { kind: k, value: '' })}
            />
          </div>
        </fieldset>
      )}
      {hasValues ? (
        <p className="text-caption text-secondary">{t('bank.answerFromValues')}</p>
      ) : kind === 'text' ? (
        <div className="grid gap-2">
          <span className="font-medium">{t('bank.accepted')}</span>
          {accepted.map((answer, index) => (
            <div key={index} className="flex gap-2">
              <input
                className={inputClass}
                aria-label={t('bank.acceptedLabel', { n: index + 1 })}
                value={answer}
                onChange={(e) => onChange({ ...value, accepted: accepted.map((a, i) => (i === index ? e.target.value : a)) })}
              />
              <Button iconOnly aria-label={t('bank.removeAccepted', { n: index + 1 })} disabled={accepted.length <= 1} onClick={() => onChange({ ...value, accepted: accepted.filter((_, i) => i !== index) })}>
                <X className="size-icon-md" aria-hidden="true" />
              </Button>
            </div>
          ))}
          <button type="button" className={`${ghostClass} justify-self-start`} onClick={() => onChange({ ...value, accepted: [...accepted, ''] })}>
            {t('bank.addAccepted')}
          </button>
          <span className="text-caption text-secondary">{t('bank.acceptedHelp')}</span>
        </div>
      ) : (
        <TextField
          id="answer-value"
          label={t('bank.correctAnswer')}
          className="font-mono"
          value={value.value ?? ''}
          onChange={(e) => onChange({ ...value, value: e.target.value })}
          help={t(kind === 'fraction' ? 'bank.fractionHelp' : 'bank.numberHelp')}
        />
      )}
      <TryAnswer answerKey={hasValues ? { kind: 'number' } : value} expected={hasValues ? sampleAnswer : null} />
    </div>
  )
}

function TryAnswer({ answerKey, expected }: { answerKey: AnswerKey; expected: number | null }) {
  const { t } = useTranslation()
  const [given, setGiven] = useState('')
  const [result, setResult] = useState<boolean | 'failed' | null>(null)

  async function run() {
    try {
      setResult(await checkAnswer({ type: 'short_answer', answer_key: answerKey, given, expected }))
    } catch {
      setResult('failed')
    }
  }

  return (
    <div className="grid gap-2 rounded-md border border-dashed border-strong p-3">
      <label htmlFor="try-answer" className="font-medium">
        {t('bank.tryAnswer')}
      </label>
      {expected !== null && <span className="text-caption text-secondary">{t('bank.tryWithSample', { answer: expected })}</span>}
      <div className="flex gap-2">
        <input id="try-answer" className={`${inputClass} font-mono`} value={given} onChange={(e) => { setGiven(e.target.value); setResult(null) }} />
        <Button onClick={run}>{t('bank.tryButton')}</Button>
      </div>
      {result === true && (
        <Alert variant="success" icon={Check} role="status">
          <Trans i18nKey="bank.tryAccepted" components={{ strong: <strong /> }} />
        </Alert>
      )}
      {result === false && (
        <Alert variant="error" icon={X} role="status">
          <Trans i18nKey="bank.tryRefused" components={{ strong: <strong /> }} />
        </Alert>
      )}
      {result === 'failed' && <span className="text-caption text-error">{t('bank.failed')}</span>}
    </div>
  )
}
