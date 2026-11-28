import { ArrowDown, ArrowLeft, ArrowUp, ChartColumn, Check, ChevronDown, CircleAlert, Info, Minus, TriangleAlert, WifiOff, type LucideIcon } from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { getAnalysis, type AnalysisCompetence, type AnalysisFlag, type AnalysisItem, type AnalysisVariant, type ItemAnalysis } from '../../api/analysis'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import { focusRing, linkClass } from '../../components/styles'
import { formatGrade } from './grading/format'

const shell = 'mx-auto grid w-full max-w-screen-wide content-start gap-6 px-4 pb-12 pt-6 tablet:px-6 tablet:pb-16 tablet:pt-8'
const cardClass = 'rounded-lg border border-subtle bg-surface'
const secondaryLink = `inline-flex min-h-hit items-center justify-center gap-2 rounded-md border border-strong bg-surface px-4 py-2 font-medium text-primary no-underline hover:bg-surface-subtle ${focusRing}`
const primaryLink = `inline-flex min-h-hit items-center justify-center gap-2 rounded-md border border-transparent bg-primary px-4 py-2 font-semibold text-on-primary no-underline hover:bg-primary-hover ${focusRing}`
const badge = 'inline-flex items-center gap-1 rounded-full px-2 text-caption font-semibold'

const flagStyle: Record<AnalysisFlag, { icon: LucideIcon; tone: string }> = {
  too_easy: { icon: ArrowUp, tone: 'bg-warning-bg text-warning' },
  too_hard: { icon: ArrowDown, tone: 'bg-warning-bg text-warning' },
  low_discrimination: { icon: CircleAlert, tone: 'bg-warning-bg text-warning' },
  negative_discrimination: { icon: TriangleAlert, tone: 'bg-error-bg text-error' },
}

/** p as a whole percentage: 0.9286 → "93%". */
const percent = (value: number) => `${Math.round(value * 100)}%`

/** A negative r already says the discrimination is low, so only it is shown. */
const shownFlags = (flags: AnalysisFlag[]) =>
  flags.includes('negative_discrimination') ? flags.filter((f) => f !== 'low_discrimination') : flags

// DS-010: the Examiner's Item Analysis of one exam (P10, D-047, C-008): success rate (the
// difficulty index p), discrimination and flags per competence, Item and drawn Variant, from
// each Candidate's counted, graded Attempt.
export default function ItemAnalysisPage() {
  const { t } = useTranslation()
  const examId = Number(useParams().id)
  const [data, setData] = useState<ItemAnalysis | null>(null)
  const [failed, setFailed] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    getAnalysis(examId).then(
      (a) => active && setData(a),
      () => active && setFailed(true),
    )
    return () => {
      active = false
    }
  }, [examId, reload])

  const grading = `/examiner/exams/${examId}/grading`
  const toGrading = <Link to={grading} className={secondaryLink}>{t('analysis.toGrading')}</Link>
  const head = (
    <div className="grid gap-2">
      <Link to={`/examiner/exams/${examId}`} className={`${linkClass} inline-flex items-center gap-1 justify-self-start text-caption`}>
        <ArrowLeft className="size-icon-sm" aria-hidden="true" />
        {t('analysis.back')}
      </Link>
      <h1 className="text-display font-semibold text-wrap">{t('analysis.title')}</h1>
      {data && <span className="text-caption text-secondary [overflow-wrap:anywhere]">{data.exam.title}</span>}
    </div>
  )

  if (!data) {
    return (
      <main className={shell}>
        {head}
        {failed ? (
          <Alert variant="error" icon={WifiOff} role="alert" action={<Button onClick={() => { setFailed(false); setReload((n) => n + 1) }}>{t('errors.retry')}</Button>}>
            {t('analysis.loadFailed')}
          </Alert>
        ) : (
          <div aria-busy="true" aria-label={t('analysis.loading')} className="grid gap-4">
            <div className="flex flex-wrap gap-3">
              {[0, 1, 2].map((k) => <div key={k} className="h-12 w-1/6 animate-pulse rounded-md bg-surface-subtle motion-reduce:animate-none max-tablet:w-1/2" />)}
            </div>
            {['w-1/2', 'w-4/5', 'w-3/5'].map((w) => <div key={w} className={`h-4 animate-pulse rounded-sm bg-surface-subtle motion-reduce:animate-none ${w}`} />)}
          </div>
        )}
      </main>
    )
  }

  const waiting = Math.max(0, data.submissions - data.graded)
  if (data.graded === 0) {
    return (
      <main className={shell}>
        {head}
        <section className="grid justify-items-center gap-3 rounded-lg border border-dashed border-strong px-6 py-12 text-center">
          <ChartColumn className="size-icon-lg" aria-hidden="true" />
          <h2 className="text-h2 font-semibold">{t('analysis.emptyTitle')}</h2>
          <p className="max-w-prose text-secondary">
            {waiting > 0 ? `${t('analysis.emptyHelp')} ${t('analysis.waiting', { count: waiting })}` : t('analysis.emptyHelp')}
          </p>
          <Link to={grading} className={primaryLink}>{t('analysis.toGrading')}</Link>
        </section>
      </main>
    )
  }

  const counted = Math.max(0, ...data.competences.flatMap((c) => c.items.map((i) => i.n)))
  const stat = (label: string, value: string) => (
    <div className="grid rounded-md border border-subtle bg-surface px-4 py-3">
      <span className="text-caption text-secondary">{label}</span>
      <span className="font-mono text-timer">{value}</span>
    </div>
  )

  return (
    <main className={shell}>
      {head}
      <div className="flex flex-wrap gap-3">
        {stat(t('analysis.analysed'), t('analysis.ofTotal', { graded: data.graded, total: data.submissions }))}
        {data.mean !== null && stat(t('analysis.mean'), formatGrade(data.mean))}
        {data.median !== null && stat(t('analysis.median'), formatGrade(data.median))}
      </div>

      {counted < 2 ? (
        <Alert variant="info" icon={Info} role="status" action={toGrading}>
          {data.graded < 2
            ? `${t('analysis.tooFew', { graded: data.graded, total: data.submissions })}${waiting > 0 ? t('analysis.tooFewWaiting', { count: waiting }) : '.'}`
            : t('analysis.tooFewCandidates')}
        </Alert>
      ) : (
        <>
          {data.recheck > 0 && (
            <Alert variant="info" icon={Info} role="status" action={toGrading}>{t('analysis.recheck', { count: data.recheck })}</Alert>
          )}
          <Legend />
          {data.competences.map((c) => <CompetenceCard key={c.code ?? '-'} competence={c} />)}
        </>
      )}
    </main>
  )
}

function Legend() {
  const { t } = useTranslation()
  const terms = ['Success', 'Disc', 'Negative', 'Unused', 'Variants', 'NoData'] as const
  return (
    <details className={`group ${cardClass}`}>
      <summary className={`flex min-h-hit cursor-pointer list-none items-center gap-2 rounded-lg px-4 font-medium [&::-webkit-details-marker]:hidden ${focusRing}`}>
        <Info className="size-icon-sm" aria-hidden="true" />
        {t('analysis.legend')}
        <ChevronDown className="size-icon-sm transition-transform duration-normal group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
      </summary>
      <dl className="m-0 grid gap-x-4 gap-y-2 px-4 pb-4 tablet:grid-cols-[max-content_minmax(0,1fr)]">
        {terms.map((term) => (
          <Fragment key={term}>
            <dt className="font-semibold">{t(`analysis.legend${term}`)}</dt>
            <dd className="m-0 text-secondary max-tablet:mb-2">{t(`analysis.legend${term}Text`)}</dd>
          </Fragment>
        ))}
      </dl>
    </details>
  )
}

function useFormat() {
  const { t, i18n } = useTranslation()
  const comma = i18n.resolvedLanguage !== 'en'
  /** r with two decimals, a comma in Romanian and a real minus sign: −0,18. */
  const r = (value: number) => {
    const digits = Math.abs(value).toFixed(2)
    return `${value < 0 ? '−' : ''}${comma ? digits.replace('.', ',') : digits}`
  }
  const noData = <span className="font-sans text-caption text-secondary">{t('analysis.noData')}</span>
  return { t, r, noData }
}

function Flags({ flags }: { flags: AnalysisFlag[] }) {
  const { t } = useTranslation()
  const shown = shownFlags(flags)
  if (shown.length === 0) return <span className="text-caption text-secondary">{t('analysis.none')}</span>
  return (
    <span className="flex flex-wrap gap-1">
      {shown.map((flag) => {
        const { icon: Icon, tone } = flagStyle[flag]
        return (
          <span key={flag} className={`${badge} ${tone}`}>
            <Icon className="size-icon-sm shrink-0" aria-hidden="true" />
            {t(`analysis.flag.${flag}`)}
          </span>
        )
      })}
    </span>
  )
}

function CompetenceCard({ competence }: { competence: AnalysisCompetence }) {
  const { t, noData } = useFormat()
  const [open, setOpen] = useState<number[]>([])
  const title = [competence.code, competence.description].filter(Boolean).join(' · ')
  const headingId = `competence-${competence.code ?? 'none'}`
  const head = 'border-b border-subtle bg-surface-subtle px-4 py-3 text-left text-caption font-semibold text-secondary'

  return (
    <section className={cardClass} aria-labelledby={headingId}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-subtle p-4">
        <h2 id={headingId} className="text-h2 font-semibold [overflow-wrap:anywhere]">
          <span className="font-mono">{competence.code}</span>
          {competence.description ? ` · ${competence.description}` : ''}
        </h2>
        <span className="flex flex-wrap items-center gap-2 text-secondary">
          <span>{t('analysis.success')} {competence.p === null ? noData : <span className="font-mono">{percent(competence.p)}</span>}</span>
          {competence.weak > 0 && (
            <span className={`${badge} bg-warning-bg text-warning`}>
              <TriangleAlert className="size-icon-sm" aria-hidden="true" />
              {t('analysis.weak', { count: competence.weak })}
            </span>
          )}
        </span>
      </div>
      <table className="w-full table-fixed border-collapse max-tablet:block" aria-label={title}>
        <colgroup className="max-tablet:hidden">
          <col className="w-1/5" /><col className="w-1/12" /><col className="w-1/6" /><col className="w-1/6" /><col /><col className="w-1/6" />
        </colgroup>
        <thead className="max-tablet:hidden">
          <tr>
            <th className={head}>{t('analysis.colItem')}</th>
            <th className={`${head} text-right`}>{t('analysis.colPoints')}</th>
            <th className={`${head} text-right`}>{t('analysis.colSuccess')}</th>
            <th className={`${head} text-right`}>{t('analysis.colDisc')}</th>
            <th className={head}>{t('analysis.colFlags')}</th>
            <th className={head}><span className="sr-only">{t('analysis.colMore')}</span></th>
          </tr>
        </thead>
        <tbody className="max-tablet:block">
          {competence.items.map((item) => (
            <ItemRows
              key={item.position}
              item={item}
              open={open.includes(item.position)}
              onToggle={() => setOpen((o) => (o.includes(item.position) ? o.filter((p) => p !== item.position) : [...o, item.position]))}
            />
          ))}
        </tbody>
      </table>
    </section>
  )
}

function ItemRows({ item, open, onToggle }: { item: AnalysisItem; open: boolean; onToggle: () => void }) {
  const { t, r, noData } = useFormat()
  const detailId = `item-${item.position}-variants`
  const cell = 'border-b border-subtle px-4 py-3 align-middle max-tablet:grid max-tablet:border-0 max-tablet:p-0'
  const label = (text: string) => <span className="font-sans text-caption text-secondary tablet:hidden">{text}</span>
  const num = 'font-mono tablet:text-right'

  return (
    <>
      <tr className="max-tablet:grid max-tablet:grid-cols-2 max-tablet:gap-x-3 max-tablet:gap-y-2 max-tablet:border-b max-tablet:border-subtle max-tablet:px-4 max-tablet:py-3">
        <td className={cell}>
          {label(t('analysis.colItem'))}
          <span className="block font-medium">{t('analysis.item', { position: item.position })}</span>
          <span className="block text-caption text-secondary">{t(`bank.section.${item.section}`)}</span>
        </td>
        <td className={`${cell} ${num}`}>{label(t('analysis.colPoints'))}<span>{item.points}</span></td>
        <td className={`${cell} ${num}`}>{label(t('analysis.colSuccess'))}{item.p === null ? noData : <span>{percent(item.p)}</span>}</td>
        <td className={`${cell} ${num}`}>{label(t('analysis.colDisc'))}{item.r === null ? noData : <span>{r(item.r)}</span>}</td>
        <td className={`${cell} max-tablet:col-span-2`}>{label(t('analysis.colFlags'))}<Flags flags={item.flags} /></td>
        <td className={`${cell} max-tablet:col-span-2 max-tablet:justify-items-center`}>
          {item.questions.length > 0 && (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={detailId}
              onClick={onToggle}
              className={`inline-flex min-h-hit items-center gap-1 rounded-md px-2 font-medium text-accent hover:bg-surface-subtle ${focusRing}`}
            >
              {t('analysis.variants', { count: item.questions.length })}
              <ChevronDown className={`size-icon-sm transition-transform duration-fast motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          )}
        </td>
      </tr>
      {open && (
        <tr id={detailId} className="max-tablet:block">
          <td colSpan={6} className="border-b border-subtle bg-surface-subtle p-4 max-tablet:block max-tablet:p-3">
            <p className="m-0 mb-3 text-caption text-secondary">{t('analysis.variantsIntro', { position: item.position })}</p>
            <div className="grid gap-3">
              {item.questions.map((q) => <VariantCard key={q.id} variant={q} />)}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function VariantCard({ variant }: { variant: AnalysisVariant }) {
  const { t, r, noData } = useFormat()
  const optionLabel = (option: number | boolean, label: string) =>
    typeof option === 'boolean' ? t(option ? 'room.true' : 'room.false') : label

  return (
    <section className="grid gap-3 rounded-md border border-subtle bg-surface px-4 py-3" aria-label={variant.code}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-mono text-caption font-semibold">{variant.code}</span>
        <span className="text-caption text-secondary">{t(`bank.type.${variant.type}`)} · {t('analysis.candidates', { count: variant.n })}</span>
        <span className="text-caption">
          {t('analysis.success')} {variant.p === null ? noData : <span className="font-mono">{percent(variant.p)}</span>}
          {' · '}
          {t('analysis.disc')} {variant.r === null ? noData : <span className="font-mono">{r(variant.r)}</span>}
        </span>
        {shownFlags(variant.flags).length > 0 && <Flags flags={variant.flags} />}
      </div>
      {variant.options && (
        <ul className="m-0 grid list-none gap-2 p-0" aria-label={t('analysis.options', { code: variant.code })}>
          {variant.options.map((o) => (
            <li key={String(o.option)} className="grid grid-cols-[minmax(0,1fr)_max-content] items-center gap-x-3 gap-y-1 tablet:grid-cols-[minmax(0,1fr)_theme(spacing.16)_theme(spacing.16)_max-content]">
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="font-mono [overflow-wrap:anywhere]">{optionLabel(o.option, o.label)}</span>
                {o.correct && (
                  <span className={`${badge} bg-success-bg text-success`}><Check className="size-icon-sm" aria-hidden="true" />{t('analysis.correct')}</span>
                )}
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-surface-subtle max-tablet:col-span-2 max-tablet:row-start-2 tablet:col-span-2" aria-hidden="true">
                {/* Wrong options take the secondary text color (DESIGN.md text-secondary); there is no such background token. */}
                <span className={`block h-full ${o.correct ? 'bg-success' : ''}`} style={{ width: percent(o.share), ...(o.correct ? {} : { backgroundColor: 'var(--text-secondary)' }) }} />
              </span>
              <span className="flex items-center justify-end gap-2 max-tablet:row-start-1 max-tablet:col-start-2">
                <span className="font-mono text-caption">{o.count} · {percent(o.share)}</span>
                {o.unused && (
                  <span className={`${badge} bg-surface-subtle text-secondary`}><Minus className="size-icon-sm" aria-hidden="true" />{t('analysis.unused')}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
