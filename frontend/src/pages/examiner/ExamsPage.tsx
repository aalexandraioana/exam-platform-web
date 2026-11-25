import { Plus, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { listExams, type ExamSummary } from '../../api/exams'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import { focusRing, linkClass } from '../../components/styles'
import { formatWindow } from './exams/format'

const strong = { strong: <strong /> }
const primaryLink = `inline-flex min-h-hit items-center justify-center gap-2 rounded-md border border-transparent bg-primary px-4 py-2 font-semibold text-on-primary no-underline hover:bg-primary-hover ${focusRing}`

// DS-008 "Examene" (Q-059): the Examiner's exams, newest first.
export default function ExamsPage() {
  const { t, i18n } = useTranslation()
  const [exams, setExams] = useState<ExamSummary[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    listExams().then(
      (list) => active && setExams(list),
      () => active && setFailed(true),
    )
    return () => {
      active = false
    }
  }, [reload])

  const cell = 'border-b border-subtle px-4 py-3 align-top'
  const head = 'border-b border-subtle bg-surface-subtle px-4 py-3 text-left text-caption font-semibold text-secondary'

  return (
    <main className="mx-auto grid w-full max-w-screen-wide content-start gap-6 px-4 pb-12 pt-6 tablet:px-6 tablet:pb-16 tablet:pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-display">{t('exams.title')}</h1>
        {exams && exams.length > 0 && (
          <Link to="/examiner/exams/new" className={primaryLink}>
            <Plus className="size-icon-sm" aria-hidden="true" />
            {t('exams.new')}
          </Link>
        )}
      </div>

      {failed && (
        <Alert variant="error" icon={WifiOff} role="alert" action={<Button onClick={() => { setFailed(false); setReload((n) => n + 1) }}>{t('errors.retry')}</Button>}>
          <Trans i18nKey="exams.loadFailed" components={strong} />
        </Alert>
      )}

      {exams === null ? (
        !failed && (
          <div aria-busy="true" aria-label={t('exams.loading')} className="grid gap-4 rounded-lg border border-subtle bg-surface p-6">
            {['w-3/5', 'w-4/5', 'w-1/2'].map((w) => <div key={w} className={`h-4 animate-pulse rounded-sm bg-surface-subtle motion-reduce:animate-none ${w}`} />)}
          </div>
        )
      ) : exams.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-lg border border-dashed border-strong px-6 py-12 text-center">
          <Plus className="size-icon-lg text-muted" aria-hidden="true" />
          <h2 className="text-h2">{t('exams.emptyTitle')}</h2>
          <p className="text-secondary">{t('exams.emptyText')}</p>
          <Link to="/examiner/exams/new" className={primaryLink}>{t('exams.newFirst')}</Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-subtle bg-surface shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={head}>{t('exams.colTitle')}</th>
                  <th className={head}>{t('exams.colStatus')}</th>
                  <th className={`${head} hidden tablet:table-cell`}>{t('exams.colClasses')}</th>
                  <th className={`${head} hidden tablet:table-cell`}>{t('exams.colWindow')}</th>
                  <th className={`${head} hidden tablet:table-cell`}>{t('exams.colItems')}</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id}>
                    <td className={`${cell} w-full [overflow-wrap:anywhere]`}>
                      <Link to={`/examiner/exams/${exam.id}`} className={`${linkClass} font-semibold`}>{exam.title}</Link>
                    </td>
                    <td className={cell}>
                      <span className={`whitespace-nowrap rounded-full px-2 text-caption font-semibold ${exam.status === 'published' ? 'bg-success-bg text-success' : 'bg-surface-subtle text-secondary'}`}>
                        {t(`exams.status.${exam.status}`)}
                      </span>
                    </td>
                    <td className={`${cell} hidden whitespace-nowrap tablet:table-cell`}>{exam.classes.map((c) => c.name).join(', ') || t('exams.missing')}</td>
                    <td className={`${cell} hidden whitespace-nowrap text-caption tablet:table-cell`}>{formatWindow(t, exam.available_from, exam.available_until, i18n.resolvedLanguage)}</td>
                    <td className={`${cell} hidden tablet:table-cell`}>{exam.item_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}
