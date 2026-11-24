import { BookOpenText, Plus, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import {
  DIFFICULTIES,
  GRADES,
  TYPES,
  copyEntry,
  createCompetence,
  createPool,
  createQuestion,
  createTopic,
  deleteQuestion,
  getQuestion,
  listCompetences,
  listLibrary,
  listPools,
  listQuestions,
  listTopics,
  type Competence,
  type Filters,
  type LibraryEntry,
  type Question,
  type QuestionSummary,
  type Ref,
} from '../../api/questions'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import { selectClass } from '../../components/SelectField'
import { focusRing } from '../../components/styles'
import { CopyDialog, DeleteDialog, NewItemDialog, NewQuestionDialog } from './questions/dialogs'
import LibraryTab from './questions/LibraryTab'
import QuestionEditor, { type ListKind } from './questions/QuestionEditor'
import { inputClass } from './questions/ui'

const strong = { strong: <strong /> }
const tabClass = (active: boolean) =>
  `inline-flex min-h-hit items-center border-b-2 px-4 font-medium ${active ? 'border-focus text-accent' : 'border-transparent text-secondary'} ${focusRing}`

type Dialog = { kind: 'new' } | { kind: 'item'; list: ListKind; resolve: (id: number | null) => void } | { kind: 'delete' } | { kind: 'copy'; entry: LibraryEntry }

// DS-007: the Examiner's question bank (D-041, D-059) and the shared library (D-027, D-040).
// The tab and the open question are in the URL (?tab=library, ?q=<id>).
export default function QuestionBankPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const library = params.get('tab') === 'library'
  const selectedId = Number(params.get('q')) || null

  const [competences, setCompetences] = useState<Competence[]>([])
  const [topics, setTopics] = useState<Ref[]>([])
  const [pools, setPools] = useState<Ref[]>([])
  const [filters, setFilters] = useState<Filters>({})
  const [questions, setQuestions] = useState<QuestionSummary[] | null>(null)
  const [all, setAll] = useState<QuestionSummary[]>([])
  const [entries, setEntries] = useState<LibraryEntry[] | null>(null)
  const [selected, setSelected] = useState<Question | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [reload, setReload] = useState(0)
  const [dialog, setDialog] = useState<Dialog | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([listCompetences(), listTopics(), listPools(), listQuestions()]).then(
      ([c, tp, p, q]) => {
        if (!active) return
        setCompetences(c)
        setTopics(tp)
        setPools(p)
        setAll(q)
      },
      () => active && setLoadFailed(true),
    )
    return () => {
      active = false
    }
  }, [reload])

  useEffect(() => {
    let active = true
    listQuestions(filters).then(
      (q) => active && setQuestions(q),
      () => active && setLoadFailed(true),
    )
    return () => {
      active = false
    }
  }, [filters, reload])

  useEffect(() => {
    if (!library) return
    let active = true
    listLibrary().then(
      (list) => active && setEntries(list),
      () => active && setLoadFailed(true),
    )
    return () => {
      active = false
    }
  }, [library, reload])

  useEffect(() => {
    if (selectedId === null) return
    let active = true
    getQuestion(selectedId).then(
      (q) => active && setSelected(q),
      () => active && setSelected(null),
    )
    return () => {
      active = false
    }
  }, [selectedId])

  function go(next: { tab?: 'library' | null; q?: number | null }) {
    const p = new URLSearchParams(params)
    if (next.tab === null) p.delete('tab')
    else if (next.tab) p.set('tab', next.tab)
    if (next.q === null) p.delete('q')
    else if (next.q) p.set('q', String(next.q))
    setParams(p)
  }

  function retry() {
    setLoadFailed(false)
    setReload((n) => n + 1)
  }

  function changed(question: Question) {
    setSelected(question)
    const summary: QuestionSummary = { ...question }
    setQuestions((list) => list?.map((q) => (q.id === question.id ? summary : q)) ?? list)
    setAll((list) => list.map((q) => (q.id === question.id ? summary : q)))
  }

  const setFilter = (key: keyof Filters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value === '' ? undefined : key === 'search' || key === 'type' || key === 'difficulty' || key === 'status' ? value : Number(value) }))

  function newItem(list: ListKind): Promise<number | null> {
    return new Promise((resolve) => setDialog({ kind: 'item', list, resolve }))
  }

  async function createItem(list: ListKind, input: { code: string; description: string; name: string }) {
    if (list === 'competence') {
      const c = await createCompetence({ code: input.code, description: input.description })
      setCompetences((l) => [...l, c].sort((a, b) => a.code.localeCompare(b.code)))
      return c.id
    }
    const item = list === 'topic' ? await createTopic(input.name) : await createPool(input.name)
    const add = (l: Ref[]) => [...l, item].sort((a, b) => a.name.localeCompare(b.name))
    if (list === 'topic') setTopics(add)
    else setPools(add)
    return item.id
  }

  const visibleEntries = (entries ?? []).filter((e) => {
    const needle = filters.search?.toLowerCase()
    if (needle && !e.code.toLowerCase().includes(needle) && !(e.statement ?? '').toLowerCase().includes(needle)) return false
    if (filters.type && e.type !== filters.type) return false
    if (filters.grade_level && e.grade_level !== filters.grade_level) return false
    if (filters.difficulty && e.difficulty !== filters.difficulty) return false
    if (filters.competence_id && e.competence?.code !== competences.find((c) => c.id === filters.competence_id)?.code) return false
    if (filters.topic_id && e.topic?.name.toLowerCase() !== topics.find((tp) => tp.id === filters.topic_id)?.name.toLowerCase()) return false
    return true
  })

  // The question in the URL, once it has loaded (a stale one is never shown).
  const open = selected && selected.id === selectedId ? selected : null
  const ready = all.filter((q) => q.status === 'ready').length
  const empty = questions !== null && all.length === 0 && !library

  return (
    <main className="mx-auto grid w-full max-w-screen-wide content-start gap-6 px-4 pb-12 pt-6 tablet:px-6 tablet:pb-16 tablet:pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-display">{t('bank.title')}</h1>
          {all.length > 0 && <span className="text-caption text-secondary">{t('bank.counts', { count: all.length, ready, drafts: all.length - ready })}</span>}
        </div>
        <Button variant="primary" onClick={() => setDialog({ kind: 'new' })}>
          <Plus className="size-icon-sm" aria-hidden="true" />
          {t('bank.new')}
        </Button>
      </div>

      <div role="tablist" className="flex border-b border-subtle">
        <button type="button" role="tab" aria-selected={!library} className={tabClass(!library)} onClick={() => go({ tab: null })}>
          {t('bank.tabMine')}
        </button>
        <button type="button" role="tab" aria-selected={library} className={tabClass(library)} onClick={() => go({ tab: 'library' })}>
          {t('bank.tabLibrary')}
        </button>
      </div>

      {loadFailed && (
        <Alert variant="error" icon={WifiOff} role="alert" action={<Button onClick={retry}>{t('errors.retry')}</Button>}>
          <Trans i18nKey="bank.loadFailed" components={strong} />
        </Alert>
      )}

      {empty ? (
        <div className="grid justify-items-center gap-3 rounded-lg border border-dashed border-strong px-6 py-12 text-center">
          <BookOpenText className="size-icon-lg text-muted" aria-hidden="true" />
          <h2 className="text-h2">{t('bank.emptyTitle')}</h2>
          <p className="text-secondary">{t('bank.emptyText')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="primary" onClick={() => setDialog({ kind: 'new' })}>
              <Plus className="size-icon-sm" aria-hidden="true" />
              {t('bank.new')}
            </Button>
            <Button onClick={() => go({ tab: 'library' })}>{t('bank.openLibrary')}</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-3 tablet:grid-cols-2 desktop:grid-cols-4">
            <input type="search" aria-label={t('bank.search')} placeholder={t('bank.search')} className={`${inputClass} tablet:col-span-2`} value={filters.search ?? ''} onChange={(e) => setFilter('search', e.target.value)} />
            <select aria-label={t('bank.filter.competence')} className={selectClass} value={filters.competence_id ?? ''} onChange={(e) => setFilter('competence_id', e.target.value)}>
              <option value="">{t('bank.allCompetences')}</option>
              {competences.map((c) => <option key={c.id} value={c.id}>{`${c.code} · ${c.description}`}</option>)}
            </select>
            <select aria-label={t('bank.filter.topic')} className={selectClass} value={filters.topic_id ?? ''} onChange={(e) => setFilter('topic_id', e.target.value)}>
              <option value="">{t('bank.allTopics')}</option>
              {topics.map((tp) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
            </select>
            {!library && (
              <select aria-label={t('bank.filter.pool')} className={selectClass} value={filters.pool_id ?? ''} onChange={(e) => setFilter('pool_id', e.target.value)}>
                <option value="">{t('bank.allPools')}</option>
                {pools.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            <select aria-label={t('bank.filter.type')} className={selectClass} value={filters.type ?? ''} onChange={(e) => setFilter('type', e.target.value)}>
              <option value="">{t('bank.allTypes')}</option>
              {TYPES.map((ty) => <option key={ty} value={ty}>{t(`bank.type.${ty}`)}</option>)}
            </select>
            <select aria-label={t('bank.filter.grade')} className={selectClass} value={filters.grade_level ?? ''} onChange={(e) => setFilter('grade_level', e.target.value)}>
              <option value="">{t('bank.allGrades')}</option>
              {GRADES.map((g) => <option key={g} value={g}>{t(`bank.grade.${g}`)}</option>)}
            </select>
            <select aria-label={t('bank.filter.difficulty')} className={selectClass} value={filters.difficulty ?? ''} onChange={(e) => setFilter('difficulty', e.target.value)}>
              <option value="">{t('bank.allDifficulties')}</option>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{t(`bank.difficulty.${d}`)}</option>)}
            </select>
            {!library && (
              <select aria-label={t('bank.filter.status')} className={selectClass} value={filters.status ?? ''} onChange={(e) => setFilter('status', e.target.value)}>
                <option value="">{t('bank.allStatuses')}</option>
                <option value="ready">{t('bank.onlyReady')}</option>
                <option value="draft">{t('bank.onlyDrafts')}</option>
              </select>
            )}
          </div>

          {library ? (
            entries === null ? <Loading label={t('bank.loading')} /> : <LibraryTab entries={visibleEntries} onCopy={(entry) => setDialog({ kind: 'copy', entry })} />
          ) : (
            <div className="grid items-start gap-4 desktop:grid-cols-[minmax(0,1fr)_var(--width-auth)]">
              {questions === null ? (
                <Loading label={t('bank.loading')} />
              ) : (
                <QuestionList questions={questions} selectedId={selectedId} onOpen={(id) => go({ q: id })} />
              )}
              {open ? (
                <QuestionEditor
                  key={open.id}
                  question={open}
                  competences={competences}
                  topics={topics}
                  pools={pools}
                  onChanged={changed}
                  onDelete={() => setDialog({ kind: 'delete' })}
                  onNewItem={newItem}
                />
              ) : (
                <p className="rounded-lg border border-dashed border-strong p-6 text-secondary">{t('bank.pickOne')}</p>
              )}
            </div>
          )}
        </>
      )}

      {dialog?.kind === 'new' && (
        <NewQuestionDialog
          onClose={() => setDialog(null)}
          onCreate={async (input) => {
            const q = await createQuestion(input)
            setReload((n) => n + 1)
            go({ tab: null, q: q.id })
          }}
        />
      )}
      {dialog?.kind === 'item' && (
        <NewItemDialog
          kind={dialog.list}
          onClose={() => {
            dialog.resolve(null)
            setDialog(null)
          }}
          onCreate={async (input) => {
            const id = await createItem(dialog.list, input)
            dialog.resolve(id)
          }}
        />
      )}
      {dialog?.kind === 'delete' && open && (
        <DeleteDialog
          code={open.code}
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await deleteQuestion(open.id)
            go({ q: null })
            setReload((n) => n + 1)
          }}
        />
      )}
      {dialog?.kind === 'copy' && (
        <CopyDialog
          entryCode={dialog.entry.code}
          onClose={() => setDialog(null)}
          onCopy={async (code) => {
            const q = await copyEntry(dialog.entry.id, code)
            const [c, tp] = await Promise.all([listCompetences(), listTopics()])
            setCompetences(c)
            setTopics(tp)
            setReload((n) => n + 1)
            go({ tab: null, q: q.id })
          }}
        />
      )}
    </main>
  )
}

function Loading({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-label={label} className="grid gap-4 rounded-lg border border-subtle bg-surface p-6">
      {['w-3/5', 'w-4/5', 'w-1/2'].map((width) => (
        <div key={width} className={`h-4 animate-pulse rounded-sm bg-surface-subtle motion-reduce:animate-none ${width}`} />
      ))}
    </div>
  )
}

function QuestionList({ questions, selectedId, onOpen }: { questions: QuestionSummary[]; selectedId: number | null; onOpen: (id: number) => void }) {
  const { t } = useTranslation()
  const cell = 'border-b border-subtle px-4 py-3 align-top'
  const head = 'border-b border-subtle bg-surface-subtle px-4 py-3 text-left text-caption font-semibold text-secondary'

  if (questions.length === 0) {
    return <p className="rounded-lg border border-subtle bg-surface p-6 text-secondary">{t('bank.noMatch')}</p>
  }
  return (
    <div className="overflow-hidden rounded-lg border border-subtle bg-surface shadow-subtle">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={head}>{t('bank.colCode')}</th>
              <th className={head}>{t('bank.colStatement')}</th>
              <th className={head}>{t('bank.colCompetence')}</th>
              <th className={head}>{t('bank.colStatus')}</th>
              <th className={`${head} hidden tablet:table-cell`}>{t('bank.colPools')}</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => {
              const current = q.id === selectedId
              return (
                <tr key={q.id} aria-current={current ? 'true' : undefined} onClick={() => onOpen(q.id)} className={`cursor-pointer ${current ? 'bg-primary-subtle' : 'hover:bg-surface-subtle'}`}>
                  <td className={cell}>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(q.id) }} className={`whitespace-nowrap rounded-sm font-mono text-caption text-primary ${focusRing}`}>
                      {q.code}
                    </button>
                  </td>
                  <td className={`${cell} w-full max-w-0 truncate`} title={q.statement ?? ''}>{q.statement}</td>
                  <td className={cell}>
                    <span className="grid justify-items-start gap-1">
                      {q.competence && <span className="rounded-sm bg-surface-subtle px-2 text-caption text-secondary">{q.competence.code}</span>}
                      <span className="text-caption text-secondary">{q.topic?.name ?? t('bank.noTopic')}</span>
                    </span>
                  </td>
                  <td className={cell}>
                    <span className={`whitespace-nowrap rounded-full px-2 text-caption font-semibold ${q.status === 'ready' ? 'bg-success-bg text-success' : 'bg-surface-subtle text-secondary'}`}>
                      {t(`bank.status.${q.status}`)}
                    </span>
                  </td>
                  <td className={`${cell} hidden text-caption tablet:table-cell`}>{q.pools.map((p) => p.name).join(', ') || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
