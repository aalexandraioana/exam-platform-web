import { ArrowDown, ArrowUp, Check, Ellipsis, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Exam, ExamItem } from '../../../api/exams'
import Button from '../../../components/Button'

// DS-008 "Structura examenului": the Items by Subject, each with its criteria (type and topic may be
// "any", D-057) and how many Ready questions it may draw.
export default function BlueprintList({ exam, onAdd, onEdit, onMove }: { exam: Exam; onAdd: () => void; onEdit: (item: ExamItem) => void; onMove: (item: ExamItem, by: -1 | 1) => void }) {
  const { t } = useTranslation()
  const locked = exam.status === 'published'
  const flagged = new Set<number>()
  for (const p of exam.checks.problems) {
    if (p.code === 'item_incomplete' && p.item) flagged.add(p.item)
    if (p.code === 'no_distinct_draw') (p.items ?? []).forEach((n) => flagged.add(n))
  }

  return (
    <section aria-labelledby="blueprint-heading" className="grid gap-4 rounded-lg border border-subtle bg-surface p-6 shadow-subtle">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2 id="blueprint-heading" className="text-h2">{t('exams.blueprint')}</h2>
          <span className="text-caption text-secondary">{t('exams.blueprintHelp')}</span>
        </div>
        {!locked && exam.items.length > 0 && <Button onClick={onAdd}>{t('exams.addItem')}</Button>}
      </div>

      {exam.items.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-lg border border-dashed border-strong px-6 py-12 text-center">
          <h3 className="text-h2">{t('exams.noItemsTitle')}</h3>
          <p className="text-secondary">{t('exams.noItemsText')}</p>
          {!locked && <Button variant="primary" onClick={onAdd}>{t('exams.addFirstItem')}</Button>}
        </div>
      ) : (
        (['subject_1', 'subject_2'] as const).map((section) => {
          const items = exam.items.filter((i) => i.section === section)
          if (items.length === 0) return null
          return (
            <div key={section} className="grid gap-3">
              <h3 className="text-h3">{t(`bank.section.${section}`)}</h3>
              {items.map((item) => (
                <ItemCard key={item.id} item={item} first={item.position === 1} last={item.position === exam.items.length} locked={locked} error={flagged.has(item.position) || item.eligible === 0} onEdit={() => onEdit(item)} onMove={(by) => onMove(item, by)} />
              ))}
            </div>
          )
        })
      )}
    </section>
  )
}

function ItemCard({ item, first, last, locked, error, onEdit, onMove }: { item: ExamItem; first: boolean; last: boolean; locked: boolean; error: boolean; onEdit: () => void; onMove: (by: -1 | 1) => void }) {
  const { t } = useTranslation()
  const n = item.position
  const term = (label: string, value: string | null, any?: string) => (
    <div className="flex gap-1">
      <dt>{label}:</dt>
      <dd className={value ? 'font-medium text-primary' : 'italic text-muted'}>{value ?? any ?? t('exams.missing')}</dd>
    </div>
  )

  return (
    <article aria-label={t('exams.itemLabel', { n })} className={`grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-md border bg-surface p-4 tablet:grid-cols-[auto_minmax(0,1fr)_auto] ${error ? 'border-error' : 'border-subtle'}`}>
      <span className="grid size-8 place-items-center rounded-full bg-surface-subtle font-bold">{n}</span>
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{item.competence ? `${item.competence.code} · ${item.competence.description}` : t('exams.noCompetence')}</span>
          {item.points !== null && <span className="rounded-full bg-primary-subtle px-2 text-caption font-semibold text-accent">{t('exams.points', { count: item.points })}</span>}
        </div>
        <dl className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-caption text-secondary">
          {term(t('exams.set'), item.pool?.name ?? null)}
          {term(t('exams.difficulty'), item.difficulty ? t(`bank.difficulty.${item.difficulty}`) : null)}
          {term(t('exams.type'), item.type ? t(`bank.type.${item.type}`) : null, t('exams.anyType'))}
          {term(t('exams.topic'), item.topic?.name ?? null, t('exams.anyTopic'))}
        </dl>
        <span className={`flex items-center gap-1 text-caption ${item.eligible > 0 ? 'text-success' : 'text-error'}`}>
          {item.eligible > 0 ? <Check className="size-icon-sm" aria-hidden="true" /> : <X className="size-icon-sm" aria-hidden="true" />}
          {item.eligible > 0 ? t('exams.matches', { count: item.eligible }) : t('exams.noMatch')}
        </span>
      </div>
      {!locked && (
        <div className="col-span-2 flex justify-end gap-1 tablet:col-span-1">
          {!first && (
            <Button iconOnly aria-label={t('exams.moveUp', { n })} onClick={() => onMove(-1)}>
              <ArrowUp className="size-icon-md" aria-hidden="true" />
            </Button>
          )}
          {!last && (
            <Button iconOnly aria-label={t('exams.moveDown', { n })} onClick={() => onMove(1)}>
              <ArrowDown className="size-icon-md" aria-hidden="true" />
            </Button>
          )}
          <Button iconOnly aria-label={t('exams.editItem', { n })} onClick={onEdit}>
            <Ellipsis className="size-icon-md" aria-hidden="true" />
          </Button>
        </div>
      )}
    </article>
  )
}
