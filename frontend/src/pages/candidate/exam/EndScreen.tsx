import { CircleCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { Attempt } from '../../../api/attempts'
import { focusRing } from '../../../components/styles'
import { dayAndTime } from '../format'

const primaryLink = `inline-flex min-h-hit items-center justify-center gap-2 rounded-md border border-transparent bg-primary px-4 py-2 font-semibold text-on-primary no-underline hover:bg-primary-hover ${focusRing}`

// DS-004 "Examen predat" / "Timp expirat" (P7c). No score before publication (D-019).
export default function EndScreen({ attempt, sealed }: { attempt: Attempt; sealed: boolean }) {
  const { t, i18n } = useTranslation()
  const when = attempt.submitted_at ?? attempt.expires_at
  const values = {
    title: attempt.exam.title,
    time: dayAndTime(when, i18n.resolvedLanguage).time,
    answered: attempt.items.filter((item) => (item.answer && item.answer.value !== null) || (item.images?.length ?? 0) > 0).length,
    total: attempt.items.length,
  }
  return (
    <main className="grid flex-1 content-start px-4 py-12">
      <div className="mx-auto grid w-full max-w-screen-tablet justify-items-center gap-4 rounded-lg border border-subtle bg-surface p-6 text-center shadow-subtle">
        <CircleCheck className="size-icon-lg text-success" aria-hidden="true" />
        <h1 className="text-h1">{t(sealed ? 'room.end.sealedTitle' : 'room.end.doneTitle')}</h1>
        <p className="text-secondary">{t(sealed ? 'room.end.sealedText' : 'room.end.doneText', values)}</p>
        <p className="text-caption text-secondary">{t('room.end.resultsLater')}</p>
        <Link to="/candidate" className={primaryLink}>{t('room.toDashboard')}</Link>
      </div>
    </main>
  )
}
