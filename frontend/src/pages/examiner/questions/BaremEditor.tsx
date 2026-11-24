import { Check, CircleAlert, X } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import Alert from '../../../components/Alert'
import Button from '../../../components/Button'
import { ghostClass, inputClass } from './ui'

type Step = { description: string; points: string }

// DS-007: the optional barem of a Subject II problem (D-031); the steps must add up to the points.
export default function BaremEditor({ steps, points, onChange }: { steps: Step[]; points: string; onChange: (steps: Step[]) => void }) {
  const { t } = useTranslation()
  const sum = steps.reduce((total, s) => total + (Number(s.points.replace(',', '.')) || 0), 0)
  const target = Number(points.replace(',', '.')) || 0
  const update = (index: number, patch: Partial<Step>) => onChange(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)))

  return (
    <div className="grid gap-2">
      {steps.map((step, index) => (
        <div key={index} className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-start gap-2">
          <span className="min-h-hit pt-3 text-caption text-secondary">{index + 1}</span>
          <textarea
            rows={2}
            className={`${inputClass} resize-y font-mono`}
            aria-label={t('bank.baremStep', { n: index + 1 })}
            value={step.description}
            onChange={(e) => update(index, { description: e.target.value })}
          />
          <input
            className={`${inputClass} w-16 text-right font-mono`}
            inputMode="decimal"
            aria-label={t('bank.baremPoints', { n: index + 1 })}
            value={step.points}
            onChange={(e) => update(index, { points: e.target.value })}
          />
          <Button iconOnly aria-label={t('bank.removeStep', { n: index + 1 })} onClick={() => onChange(steps.filter((_, i) => i !== index))}>
            <X className="size-icon-md" aria-hidden="true" />
          </Button>
        </div>
      ))}
      <button type="button" className={`${ghostClass} justify-self-start`} onClick={() => onChange([...steps, { description: '', points: '' }])}>
        {t('bank.addStep')}
      </button>
      <Alert variant={sum === target && steps.length > 0 ? 'success' : 'error'} icon={sum === target && steps.length > 0 ? Check : CircleAlert} role="status">
        <Trans i18nKey="bank.baremSum" values={{ sum, points: target }} components={{ strong: <strong className="font-mono" /> }} />
      </Alert>
    </div>
  )
}
