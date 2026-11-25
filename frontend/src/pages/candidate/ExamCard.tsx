import { CalendarDays, Check, Clock, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CandidateExam } from '../../api/attempts'
import Button from '../../components/Button'
import { dayAndTime } from './format'

const badge = 'inline-flex items-center gap-1 justify-self-start rounded-full bg-surface-subtle px-2 text-caption font-semibold text-secondary'
const icon = 'size-icon-sm shrink-0'

// DS-003 exam card, by state (P7a): open, upcoming, submitted awaiting grading (D-019), submitted
// with attempts left. Topic chips only (Q-069), the description under the title (Q-064).
export default function ExamCard({ exam, busy, onStart }: { exam: CandidateExam; busy: boolean; onStart: (exam: CandidateExam) => void }) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage
  const upcoming = exam.state === 'upcoming'

  let when: string | null = null
  if (exam.state === 'open' && (!exam.submitted || exam.can_start)) {
    const attempts = exam.submitted
      ? t('candidate.attemptOf', { number: exam.attempts_used + 1, max: exam.max_attempts })
      : exam.max_attempts > 1 ? t('candidate.attempts', { count: exam.max_attempts }) : null
    const until = exam.available_until ? t('candidate.until', dayAndTime(exam.available_until, language)) : null
    when = [until, attempts].filter(Boolean).join(' · ') || null
  } else if (upcoming && exam.max_attempts > 1) {
    when = t('candidate.attempts', { count: exam.max_attempts })
  }

  return (
    <article className="grid content-between gap-3 rounded-lg border border-subtle bg-surface p-6 shadow-subtle">
      <div className="grid gap-2">
        {exam.topics.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {exam.topics.map((topic) => (
              <li key={topic} className="rounded-sm bg-surface-subtle px-2 text-caption text-secondary">{topic}</li>
            ))}
          </ul>
        )}
        <h3 className="text-h2 [overflow-wrap:anywhere]">{exam.title}</h3>
        {exam.description && <p className="text-secondary [overflow-wrap:anywhere]">{exam.description}</p>}
      </div>
      <ul className="grid gap-2 border-t border-subtle pt-3 text-caption text-secondary">
        <li className="flex items-start gap-2"><Clock className={icon} aria-hidden="true" />{t('candidate.duration', { duration: t('duration.minutes', { count: exam.duration_minutes }) })}</li>
        <li className="flex items-start gap-2"><FileText className={icon} aria-hidden="true" />{t('candidate.structure')}</li>
        {when && <li className="flex items-start gap-2"><CalendarDays className={icon} aria-hidden="true" />{when}</li>}
      </ul>
      {upcoming && exam.available_from && (
        <span className={badge}><Clock className={icon} aria-hidden="true" />{t('candidate.opensOn', dayAndTime(exam.available_from, language, false))}</span>
      )}
      {exam.submitted && <span className={badge}><Check className={icon} aria-hidden="true" />{t('candidate.submitted')}</span>}
      {exam.can_start ? (
        <Button className="w-full" disabled={busy} onClick={() => onStart(exam)}>
          {t(exam.submitted ? 'candidate.startAgain' : 'candidate.start')}
        </Button>
      ) : (
        exam.submitted && <p className="text-caption text-secondary">{t('candidate.resultLater')}</p>
      )}
    </article>
  )
}
