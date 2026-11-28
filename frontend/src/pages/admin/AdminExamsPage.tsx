import { List, RotateCw, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { listAllExams, type SupervisedExam } from '../../api/overview'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import { selectClass } from '../../components/SelectField'
import { formatWindow } from '../examiner/exams/format'

const strong = { strong: <strong /> }
const filters = ['all', 'active', 'archived', 'drafts'] as const
type Filter = (typeof filters)[number]

/** Q-098: active = upcoming or open; archived = closed (the window has ended); drafts = not published. */
const matches: Record<Filter, (e: SupervisedExam) => boolean> = {
  all: () => true,
  active: (e) => e.state === 'upcoming' || e.state === 'open',
  archived: (e) => e.state === 'closed',
  drafts: (e) => e.status === 'draft',
}

const badge = 'whitespace-nowrap rounded-full px-2 text-caption font-semibold'
const stateTone: Record<string, string> = {
  draft: 'bg-surface-subtle text-secondary',
  upcoming: 'bg-primary-subtle text-accent',
  open: 'bg-success-bg text-success',
  closed: 'bg-surface-subtle text-secondary',
}

// DS-012 (P11, C-009, Q-098): every exam on the platform, read-only, with a state filter.
export default function AdminExamsPage() {
  const { t, i18n } = useTranslation()
  const [exams, setExams] = useState<SupervisedExam[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [reload, setReload] = useState(0)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    let active = true
    listAllExams().then(
      (list) => active && setExams(list),
      () => active && setFailed(true),
    )
    return () => {
      active = false
    }
  }, [reload])

  const shown = exams?.filter(matches[filter]) ?? []
  const cell = 'border-b border-subtle px-4 py-3 align-middle max-tablet:border-0 max-tablet:p-0'
  const th = 'border-b border-subtle bg-surface-subtle px-4 py-3 text-left text-caption font-semibold text-secondary'
  const label = (text: string) => <span className="text-caption text-secondary tablet:hidden">{text}</span>

  return (
    <main className="mx-auto grid w-full max-w-screen-desktop content-start gap-6 px-4 pb-12 pt-6 tablet:px-6 tablet:pb-16 tablet:pt-8">
      <div className="grid gap-2">
        <h1 className="text-display">{t('supervision.title')}</h1>
        <p className="text-secondary">{t('supervision.subtitle')}</p>
      </div>

      {failed && (
        <Alert variant="error" icon={WifiOff} role="alert" action={<Button onClick={() => { setFailed(false); setReload((n) => n + 1) }}><RotateCw className="size-icon-sm" aria-hidden="true" />{t('errors.retry')}</Button>}>
          <Trans i18nKey="supervision.loadFailed" components={strong} />
        </Alert>
      )}

      {exams?.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-lg border border-dashed border-strong px-6 py-12 text-center">
          <List className="size-icon-lg text-muted" aria-hidden="true" />
          <h2 className="text-h2">{t('supervision.emptyTitle')}</h2>
          <p className="max-w-[520px] text-secondary">{t('supervision.emptyText')}</p>
        </div>
      ) : (
        !failed && (
          <section aria-label={t('supervision.title')} className="grid gap-2 overflow-hidden rounded-lg border border-subtle bg-surface shadow-subtle">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-6 pt-4 max-tablet:px-4">
              <label htmlFor="exam-filter" className="font-medium">{t('supervision.show')}</label>
              <select id="exam-filter" className={`${selectClass} tablet:max-w-[240px]`} value={filter} onChange={(e) => setFilter(e.target.value as Filter)} disabled={!exams}>
                {filters.map((f) => (
                  <option key={f} value={f}>{t(`supervision.filter.${f}`, { count: exams?.filter(matches[f]).length ?? 0 })}</option>
                ))}
              </select>
            </div>

            {exams === null ? (
              <div aria-busy="true" aria-label={t('supervision.loading')} className="grid gap-4 px-6 pb-6 pt-4">
                {['w-3/5', 'w-4/5', 'w-1/2'].map((w) => <div key={w} className={`h-4 animate-pulse rounded-sm bg-surface-subtle motion-reduce:animate-none ${w}`} />)}
              </div>
            ) : shown.length === 0 ? (
              <p className="px-6 pb-6 pt-4 text-secondary">{t(`supervision.none.${filter}`)}</p>
            ) : (
              <table className="w-full table-fixed border-collapse max-tablet:block">
                <colgroup className="max-tablet:hidden">
                  <col />
                  <col className="w-[17%]" />
                  <col className="w-[22%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                </colgroup>
                <thead className="max-tablet:hidden">
                  <tr>
                    <th className={th}>{t('supervision.colExam')}</th>
                    <th className={th}>{t('supervision.colState')}</th>
                    <th className={th}>{t('supervision.colWindow')}</th>
                    <th className={th}>{t('supervision.colClasses')}</th>
                    <th className={`${th} text-right`}>{t('supervision.colAttempts')}</th>
                  </tr>
                </thead>
                <tbody className="max-tablet:block">
                  {shown.map((exam) => (
                    <tr key={exam.id} className="max-tablet:grid max-tablet:grid-cols-2 max-tablet:gap-x-3 max-tablet:gap-y-2 max-tablet:border-b max-tablet:border-subtle max-tablet:px-4 max-tablet:py-3 [&:last-child>td]:border-b-0">
                      <td className={`${cell} max-tablet:col-span-2`}>
                        <span className="block font-medium [overflow-wrap:anywhere]">{exam.title}</span>
                        <span className="block text-caption text-secondary [overflow-wrap:anywhere]">{exam.examiner.name}</span>
                      </td>
                      <td className={`${cell} max-tablet:grid`}>
                        {label(t('supervision.colState'))}
                        <span className="flex flex-wrap gap-1">
                          <span className={`${badge} ${stateTone[exam.state ?? 'draft']}`}>{t(`supervision.state.${exam.state ?? 'draft'}`)}</span>
                          {exam.results_published_at && <span className={`${badge} bg-success-bg text-success`}>{t('supervision.resultsPublished')}</span>}
                        </span>
                      </td>
                      <td className={`${cell} text-caption max-tablet:grid`}>
                        {label(t('supervision.colWindow'))}
                        <span className={exam.status === 'draft' && !exam.available_from && !exam.available_until ? 'text-secondary' : ''}>
                          {exam.status === 'draft' && !exam.available_from && !exam.available_until ? t('supervision.unset') : formatWindow(t, exam.available_from, exam.available_until, i18n.resolvedLanguage)}
                        </span>
                      </td>
                      <td className={`${cell} [overflow-wrap:anywhere] max-tablet:grid`}>
                        {label(t('supervision.colClasses'))}
                        {exam.classes.length > 0 ? exam.classes.map((c) => c.name).join(', ') : <span className="text-secondary">{t('supervision.noClasses')}</span>}
                      </td>
                      <td className={`${cell} text-right font-mono max-tablet:grid max-tablet:text-left`}>
                        {label(t('supervision.colAttempts'))}
                        {exam.status === 'draft' ? '–' : `${exam.attempts.submitted} / ${exam.attempts.graded}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )
      )}
    </main>
  )
}
