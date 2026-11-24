import { RotateCw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { preview, type Problem, type QuestionType, type Sample } from '../../../api/questions'
import Button from '../../../components/Button'
import { selectClass } from '../../../components/SelectField'
import TextField from '../../../components/TextField'
import { emptyRow, parametersFrom, type ValueKind, type ValueRow, type ValuesForm } from './form'
import { problemText } from './problems'
import { ghostClass, inputClass } from './ui'

interface Props {
  type: QuestionType
  statement: string
  options: string[]
  value: ValuesForm
  onChange: (values: ValuesForm) => void
  onSamples: (samples: Sample[]) => void
}

const PREVIEW_DELAY_MS = 500

// DS-007 "Valori": named values (D-057), fixed, random (whole numbers, Q-048) or calculated,
// with sample draws from the server (P4a engine) shortly after each change.
export default function ValuesEditor({ type, statement, options, value, onChange, onSamples }: Props) {
  const { t } = useTranslation()
  const [samples, setSamples] = useState<Sample[]>([])
  const [problems, setProblems] = useState<Problem[]>([])
  const [failed, setFailed] = useState(false)
  const [run, setRun] = useState(0)

  const request = JSON.stringify({ type, statement, options, parameters: parametersFrom(value) })

  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      preview(JSON.parse(request)).then(
        (result) => {
          if (!active) return
          setFailed(false)
          setProblems(result.problems)
          setSamples(result.samples)
          onSamples(result.samples)
        },
        () => active && setFailed(true),
      )
    }, PREVIEW_DELAY_MS)
    return () => {
      active = false
      clearTimeout(timer)
    }
    // onSamples is a setter from the parent; the request text covers every input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, run])

  const rows = value.rows
  const update = (index: number, patch: Partial<ValueRow>) => onChange({ ...value, rows: rows.map((r, i) => (i === index ? { ...r, ...patch } : r)) })

  return (
    <div className="grid gap-4">
      <span className="font-medium">{t('bank.valuesTitle')}</span>
      <div className="grid gap-3">
        {rows.map((row, index) => {
          const name = row.name || '…'
          return (
            <div key={index} className="grid gap-2 border-b border-subtle pb-3 last:border-b-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className={`${inputClass} w-hit flex-none text-center font-mono font-bold text-accent`}
                  aria-label={t('bank.valueName')}
                  value={row.name}
                  onChange={(e) => update(index, { name: e.target.value })}
                />
                <select className={`${selectClass} w-auto flex-1`} aria-label={t('bank.valueKind', { name })} value={row.kind} onChange={(e) => update(index, { kind: e.target.value as ValueKind })}>
                  <option value="random">{t('bank.kindRandom')}</option>
                  <option value="fixed">{t('bank.kindFixed')}</option>
                  <option value="calculated">{t('bank.kindCalculated')}</option>
                </select>
                <Button iconOnly aria-label={t('bank.removeValue', { name })} onClick={() => onChange({ ...value, rows: rows.filter((_, i) => i !== index) })}>
                  <X className="size-icon-md" aria-hidden="true" />
                </Button>
              </div>
              {row.kind === 'random' && (
                <div className="grid grid-cols-2 gap-2">
                  <TextField id={`value-${index}-min`} label={t('bank.min')} className="font-mono" inputMode="numeric" value={row.min} onChange={(e) => update(index, { min: e.target.value })} />
                  <TextField id={`value-${index}-max`} label={t('bank.max')} className="font-mono" inputMode="numeric" value={row.max} onChange={(e) => update(index, { max: e.target.value })} />
                  <div className="col-span-2">
                    <TextField id={`value-${index}-except`} label={t('bank.except')} placeholder={t('bank.exceptPlaceholder')} className="font-mono" value={row.except} onChange={(e) => update(index, { except: e.target.value })} />
                  </div>
                </div>
              )}
              {row.kind === 'fixed' && (
                <TextField id={`value-${index}-fixed`} label={t('bank.fixedValue')} className="font-mono" inputMode="numeric" value={row.fixed} onChange={(e) => update(index, { fixed: e.target.value })} />
              )}
              {row.kind === 'calculated' && (
                <TextField id={`value-${index}-formula`} label={t('bank.formula')} className="font-mono" value={row.formula} onChange={(e) => update(index, { formula: e.target.value })} />
              )}
            </div>
          )
        })}
      </div>
      <button type="button" className={`${ghostClass} justify-self-start`} onClick={() => onChange({ ...value, rows: [...rows, emptyRow()] })}>
        {t('bank.addValue')}
      </button>
      <span className="text-caption text-secondary">{t('bank.valuesHelp')}</span>
      <TextField id="value-conditions" label={<>{t('bank.conditions')} <span className="font-normal text-secondary">{t('bank.optional')}</span></>} className="font-mono" value={value.conditions} onChange={(e) => onChange({ ...value, conditions: e.target.value })} help={t('bank.conditionsHelp')} />
      {type === 'short_answer' && (
        <TextField id="value-answer" label={t('bank.answerFormula')} className="font-mono" value={value.answer} onChange={(e) => onChange({ ...value, answer: e.target.value })} />
      )}

      <div className="grid gap-2" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">{t('bank.samples')}</span>
          <Button onClick={() => setRun((n) => n + 1)}>
            <RotateCw className="size-icon-sm" aria-hidden="true" />
            {t('bank.moreSamples')}
          </Button>
        </div>
        {failed ? (
          <span className="text-caption text-error">{t('bank.previewFailed')}</span>
        ) : problems.length > 0 ? (
          <ul className="grid gap-1 text-caption text-error">
            {problems.map((p, i) => (
              <li key={i}>{problemText(t, p)}</li>
            ))}
          </ul>
        ) : (
          <div className="grid gap-1 font-mono text-caption">
            {samples.map((sample, i) => (
              <div key={i} className="rounded-sm bg-surface-subtle px-2 py-1 [overflow-wrap:anywhere]">
                {Object.entries(sample.values).map(([k, v]) => `${k} = ${v}`).join(', ')}
                {sample.answer !== null && ` · ${t('bank.sampleAnswer', { answer: sample.answer })}`}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
