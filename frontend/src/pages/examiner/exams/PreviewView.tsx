import { Eye, RotateCw, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { previewExam, type PreviewItem } from '../../../api/exams'
import Alert from '../../../components/Alert'
import Button from '../../../components/Button'
import { letter } from '../questions/problems'

const strong = { strong: <strong /> }

// DS-008 "Previzualizare candidat": one draw as a Candidate would get it (D-057), nothing saved.
export default function PreviewView({ examId, onClose }: { examId: number; onClose: () => void }) {
  const { t } = useTranslation()
  const [items, setItems] = useState<PreviewItem[] | null>(null)
  const [failed, setFailed] = useState<'draw' | 'network' | null>(null)
  const [run, setRun] = useState(0)

  useEffect(() => {
    let active = true
    previewExam(examId).then(
      (list) => {
        if (!active) return
        setFailed(null)
        setItems(list)
      },
      (error: { status?: number }) => active && setFailed(error?.status === 422 ? 'draw' : 'network'),
    )
    return () => {
      active = false
    }
  }, [examId, run])

  return (
    <div className="grid gap-6">
      <Alert
        variant="info"
        icon={Eye}
        role="status"
        action={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setRun((n) => n + 1)}>
              <RotateCw className="size-icon-sm" aria-hidden="true" />
              {t('exams.previewAgain')}
            </Button>
            <Button onClick={onClose}>{t('exams.previewClose')}</Button>
          </div>
        }
      >
        <Trans i18nKey="exams.previewNotice" components={strong} />
      </Alert>
      {failed === 'draw' && <Alert variant="error" icon={WifiOff} role="alert">{t('exams.previewFailed')}</Alert>}
      {failed === 'network' && <Alert variant="error" icon={WifiOff} role="alert">{t('exams.failed')}</Alert>}
      {items && (
        <section aria-labelledby="preview-heading" className="grid gap-6 rounded-lg border border-subtle bg-surface p-6 shadow-subtle">
          <h2 id="preview-heading" className="text-h1">{t('exams.previewTitle')}</h2>
          {items.map((item) => {
            const values = Object.entries(item.values).map(([k, v]) => `${k} = ${v}`).join(', ')
            return (
              <div key={item.item_id} className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-full bg-surface-subtle font-bold">{item.position}</span>
                  {item.competence && <span className="rounded-sm bg-surface-subtle px-2 text-caption text-secondary">{item.competence}</span>}
                  <span className="text-caption text-secondary">{t('exams.previewDrawn', { code: item.code, count: item.eligible })}</span>
                </div>
                {(values || item.answer !== null) && (
                  <span className="font-mono text-caption text-secondary">{t('exams.previewValues', { values, answer: item.answer ?? '—' })}</span>
                )}
                <div className="rounded-sm border-l-2 border-focus bg-surface-subtle p-4 font-mono [overflow-wrap:anywhere]">
                  <p className="whitespace-pre-line">{item.statement}</p>
                  {item.options.length > 0 && (
                    <ul className="mt-2 grid gap-1">
                      {item.options.map((option, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-secondary">{letter(i)})</span>
                          <span>{option}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
