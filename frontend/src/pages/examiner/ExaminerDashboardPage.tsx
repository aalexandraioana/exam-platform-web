import { CalendarCheck, CircleAlert, CircleCheck, ClipboardCheck, FilePlus, Plus, RotateCw, Timer, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { listExams } from '../../api/exams'
import { getDashboard, type Dashboard } from '../../api/overview'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import { focusRing } from '../../components/styles'
import { formatDateTime } from './exams/format'

const shell = 'mx-auto grid w-full max-w-screen-desktop content-start gap-6 px-4 pb-12 pt-6 tablet:px-6 tablet:pb-16 tablet:pt-8'
const linkButton = `inline-flex min-h-hit items-center justify-center gap-2 rounded-md border px-4 py-2 font-medium no-underline ${focusRing}`
const secondaryLink = `${linkButton} border-input bg-surface text-primary hover:bg-surface-subtle`
const primaryLink = `${linkButton} border-transparent bg-primary font-semibold text-on-primary hover:bg-primary-hover`

// DS-006 (P11, C-009): the Examiner's landing (Q-099): three counts and the exams that need attention.
export default function ExaminerDashboardPage() {
  const { t, i18n } = useTranslation()
  const [data, setData] = useState<Dashboard | null>(null)
  // With nothing to show, whether the Examiner has published an exam yet (C-005's list).
  const [published, setPublished] = useState<boolean | null>(null)
  const [failed, setFailed] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    getDashboard().then(
      async (dashboard) => {
        const idle = dashboard.exams.length === 0 && dashboard.counts.attempts_in_progress === 0
        const any = idle ? (await listExams()).some((e) => e.status === 'published') : true
        if (active) {
          setPublished(any)
          setData(dashboard)
        }
      },
      () => active && setFailed(true),
    ).catch(() => active && setFailed(true))
    return () => {
      active = false
    }
  }, [reload])

  const head = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-display">{t('dashboard.title')}</h1>
    </div>
  )

  if (failed) {
    return (
      <main className={shell}>
        {head}
        <Alert variant="error" icon={CircleAlert} role="alert" action={<Button onClick={() => { setFailed(false); setData(null); setReload((n) => n + 1) }}><RotateCw className="size-icon-sm" aria-hidden="true" />{t('errors.retry')}</Button>}>
          {t('dashboard.loadFailed')}
        </Alert>
      </main>
    )
  }

  if (!data) {
    return (
      <main className={shell}>
        {head}
        <div aria-busy="true" aria-label={t('dashboard.loading')} className="grid gap-4">
          <div className="grid gap-3 tablet:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="grid gap-2 rounded-md border border-subtle bg-surface p-4">
                <div className="h-4 w-32 animate-pulse rounded-sm bg-surface-subtle motion-reduce:animate-none" />
                <div className="h-4 w-12 animate-pulse rounded-sm bg-surface-subtle motion-reduce:animate-none" />
              </div>
            ))}
          </div>
          <div className="grid gap-2 rounded-lg border border-subtle bg-surface p-6">
            {['w-2/5', 'w-full', 'w-full'].map((w, i) => <div key={i} className={`h-4 animate-pulse rounded-sm bg-surface-subtle motion-reduce:animate-none ${w}`} />)}
          </div>
        </div>
      </main>
    )
  }

  const { counts } = data
  const stat = (Icon: LucideIcon, label: string, value: number) => (
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 rounded-md border border-subtle bg-surface p-4">
      <Icon className="row-span-2 size-icon-lg text-accent" aria-hidden="true" />
      <span className="text-caption text-secondary">{label}</span>
      <span className="font-mono text-timer">{value}</span>
    </div>
  )
  const cell = 'border-b border-subtle px-4 py-3 align-middle max-tablet:border-0 max-tablet:p-0'
  const th = 'border-b border-subtle bg-surface-subtle px-4 py-3 text-left text-caption font-semibold text-secondary'
  const label = (text: string) => <span className="text-caption text-secondary tablet:hidden">{text}</span>

  return (
    <main className={shell}>
      {head}
      <div className="grid gap-3 tablet:grid-cols-3">
        {stat(CalendarCheck, t('dashboard.active'), counts.active_exams)}
        {stat(Timer, t('dashboard.inProgress'), counts.attempts_in_progress)}
        {stat(ClipboardCheck, t('dashboard.awaiting'), counts.awaiting_grading)}
      </div>

      {data.exams.length > 0 ? (
        <section aria-labelledby="attention" className="grid gap-2 overflow-hidden rounded-lg border border-subtle bg-surface shadow-subtle">
          <h2 id="attention" className="px-6 pt-4 text-h2 max-tablet:px-4">{t('dashboard.attention')}</h2>
          <table className="w-full table-fixed border-collapse max-tablet:block">
            <colgroup className="max-tablet:hidden">
              <col />
              <col className="w-[16%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead className="max-tablet:hidden">
              <tr>
                <th className={th}>{t('dashboard.colExam')}</th>
                <th className={th}>{t('dashboard.colState')}</th>
                <th className={`${th} text-right`}>{t('dashboard.colInProgress')}</th>
                <th className={`${th} text-right`}>{t('dashboard.colAwaiting')}</th>
                <th className={th}><span className="sr-only">{t('dashboard.colAction')}</span></th>
              </tr>
            </thead>
            <tbody className="max-tablet:block">
              {data.exams.map((exam) => (
                <tr key={exam.id} className="max-tablet:grid max-tablet:grid-cols-2 max-tablet:gap-x-3 max-tablet:gap-y-2 max-tablet:border-b max-tablet:border-subtle max-tablet:px-4 max-tablet:py-3 [&:last-child>td]:border-b-0">
                  <td className={`${cell} max-tablet:col-span-2`}>
                    <span className="block font-medium [overflow-wrap:anywhere]">{exam.title}</span>
                    <span className="block text-caption text-secondary">
                      {exam.available_until
                        ? t(exam.state === 'open' ? 'dashboard.closesOn' : 'dashboard.closedOn', { date: formatDateTime(exam.available_until, i18n.resolvedLanguage) })
                        : t('dashboard.noEnd')}
                    </span>
                  </td>
                  <td className={`${cell} max-tablet:grid`}>
                    {label(t('dashboard.colState'))}
                    <span>
                      <span className={`whitespace-nowrap rounded-full px-2 text-caption font-semibold ${exam.state === 'open' ? 'bg-success-bg text-success' : 'bg-surface-subtle text-secondary'}`}>
                        {t(`dashboard.state.${exam.state}`)}
                      </span>
                    </span>
                  </td>
                  <td className={`${cell} text-right font-mono max-tablet:grid max-tablet:text-left`}>{label(t('dashboard.colInProgress'))}{exam.in_progress}</td>
                  <td className={`${cell} text-right font-mono max-tablet:grid max-tablet:text-left`}>{label(t('dashboard.colAwaiting'))}{exam.awaiting_grading}</td>
                  <td className={`${cell} max-tablet:col-span-2`}>
                    <Link to={`/examiner/exams/${exam.id}/grading`} className={`${secondaryLink} max-tablet:w-full`}>
                      <ClipboardCheck className="size-icon-sm" aria-hidden="true" />
                      {t('dashboard.grade')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : published ? (
        <div className="grid justify-items-center gap-3 rounded-lg border border-dashed border-strong px-6 py-12 text-center">
          <CircleCheck className="size-icon-lg text-muted" aria-hidden="true" />
          <h2 className="text-h2">{t('dashboard.calmTitle')}</h2>
          <p className="max-w-[520px] text-secondary">{t('dashboard.calmText')}</p>
          <Link to="/examiner/exams" className={secondaryLink}>{t('dashboard.seeExams')}</Link>
        </div>
      ) : (
        <div className="grid justify-items-center gap-3 rounded-lg border border-dashed border-strong px-6 py-12 text-center">
          <FilePlus className="size-icon-lg text-muted" aria-hidden="true" />
          <h2 className="text-h2">{t('dashboard.emptyTitle')}</h2>
          <p className="max-w-[520px] text-secondary">{t('dashboard.emptyText')}</p>
          <Link to="/examiner/exams/new" className={primaryLink}>
            <Plus className="size-icon-sm" aria-hidden="true" />
            {t('dashboard.newExam')}
          </Link>
        </div>
      )}
    </main>
  )
}
