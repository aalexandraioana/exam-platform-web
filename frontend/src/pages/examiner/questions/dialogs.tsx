import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../../api/client'
import { SECTIONS, typesFor, type QuestionType, type Section } from '../../../api/questions'
import Button from '../../../components/Button'
import Modal from '../../../components/Modal'
import SelectField from '../../../components/SelectField'
import TextField from '../../../components/TextField'
import type { ListKind } from './QuestionEditor'
import { TextAreaField } from './ui'

const CODE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

/** The text of a code error from the client check or a 422 code (Q-054). */
function codeError(t: (key: string) => string, code: string | null): string | undefined {
  if (code === 'required') return t('bank.codeRequired')
  if (code === 'invalid') return t('bank.codeInvalid')
  if (code === 'taken') return t('bank.codeTaken')
  return undefined
}

function checkCode(code: string): string | null {
  if (!code) return 'required'
  return code.length > 28 || !CODE.test(code) ? 'invalid' : null
}

// DS-007 "Întrebare nouă": a Draft from a code, a Subject and a type (Q-054, D-059).
export function NewQuestionDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (input: { code: string; section: Section; type: QuestionType }) => Promise<void> }) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [section, setSection] = useState<Section>('subject_1')
  const [type, setType] = useState<QuestionType>('single_choice')
  const [error, setError] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const problem = checkCode(code.trim())
    setError(problem)
    if (problem) return
    setBusy(true)
    setFailed(false)
    try {
      await onCreate({ code: code.trim(), section, type })
      onClose()
    } catch (e) {
      setBusy(false)
      if (e instanceof ApiError && e.status === 422 && e.fields.code) setError(e.fields.code[0])
      else setFailed(true)
    }
  }

  return (
    <Modal title={t('bank.newTitle')} onClose={onClose}>
      <form noValidate onSubmit={submit} className="grid gap-4">
        <TextField id="new-code" label={t('bank.code')} placeholder={t('bank.codePlaceholder')} className="font-mono" value={code} maxLength={28} onChange={(e) => setCode(e.target.value)} error={codeError(t, error)} help={error ? undefined : t('bank.codeHelp')} />
        <div className="grid gap-3 tablet:grid-cols-2">
          <SelectField id="new-section" label={t('bank.fieldSection')} value={section} onChange={(e) => { const s = e.target.value as Section; setSection(s); setType(typesFor(s)[0]) }}>
            {SECTIONS.map((s) => (
              <option key={s} value={s}>{t(`bank.section.${s}`)}</option>
            ))}
          </SelectField>
          <SelectField id="new-type" label={t('bank.fieldType')} value={type} onChange={(e) => setType(e.target.value as QuestionType)}>
            {typesFor(section).map((ty) => (
              <option key={ty} value={ty}>{t(`bank.type.${ty}`)}</option>
            ))}
          </SelectField>
        </div>
        <p className="text-caption text-secondary">{t('bank.newHelp')}</p>
        {failed && <p className="text-caption text-error">{t('bank.failed')}</p>}
        <div className="flex flex-wrap justify-end gap-3">
          <Button onClick={onClose}>{t('bank.cancel')}</Button>
          <Button type="submit" variant="primary" disabled={busy}>{t('bank.createDraft')}</Button>
        </div>
      </form>
    </Modal>
  )
}

// Q-053: a new competence (code + what it assesses), topic or pool (a name), inline from a select.
export function NewItemDialog({ kind, onClose, onCreate }: { kind: ListKind; onClose: () => void; onCreate: (input: { code: string; description: string; name: string }) => Promise<void> }) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const competence = kind === 'competence'

  async function submit(event: FormEvent) {
    event.preventDefault()
    const found: Record<string, string> = {}
    if (competence) {
      if (!code.trim()) found.code = 'required'
      if (!description.trim()) found.description = 'required'
    } else if (!name.trim()) found.name = 'required'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    setFailed(false)
    try {
      await onCreate({ code: code.trim(), description: description.trim(), name: name.trim() })
      onClose()
    } catch (e) {
      setBusy(false)
      if (e instanceof ApiError && e.status === 422) setErrors(Object.fromEntries(Object.entries(e.fields).map(([k, v]) => [k, v[0]])))
      else setFailed(true)
    }
  }

  const message = (code?: string) => (code === 'taken' ? t('bank.nameTaken') : code ? t('bank.required') : undefined)
  const title = t(competence ? 'bank.competenceTitle' : kind === 'topic' ? 'bank.topicTitle' : 'bank.poolTitle')

  return (
    <Modal title={title} onClose={onClose}>
      <form noValidate onSubmit={submit} className="grid gap-4">
        {competence ? (
          <>
            <TextField id="item-code" label={t('bank.competenceCode')} className="font-mono" maxLength={20} value={code} onChange={(e) => setCode(e.target.value)} error={message(errors.code)} />
            <TextAreaField id="item-description" label={t('bank.competenceDescription')} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} error={message(errors.description)} help={t('bank.competenceHelp')} />
          </>
        ) : (
          <TextField id="item-name" label={t('bank.name')} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} error={message(errors.name)} />
        )}
        {failed && <p className="text-caption text-error">{t('bank.failed')}</p>}
        <div className="flex flex-wrap justify-end gap-3">
          <Button onClick={onClose}>{t('bank.cancel')}</Button>
          <Button type="submit" variant="primary" disabled={busy}>{t(competence ? 'bank.addCompetence' : 'bank.add')}</Button>
        </div>
      </form>
    </Modal>
  )
}

// Q-056: deleting asks first; a drawn question is refused by the server (409).
export function DeleteDialog({ code, onClose, onConfirm }: { code: string; onClose: () => void; onConfirm: () => Promise<void> }) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (e) {
      setBusy(false)
      setError(t(e instanceof ApiError && e.status === 409 ? 'bank.deleteDrawn' : 'bank.failed'))
    }
  }

  return (
    <Modal role="alertdialog" title={t('bank.deleteTitle', { code })} onClose={onClose}>
      <p className="text-secondary">{t('bank.deleteText')}</p>
      {error && <p role="alert" className="text-caption text-error">{error}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <Button onClick={onClose}>{t('bank.cancel')}</Button>
        <Button variant="danger" onClick={confirm} disabled={busy}>
          <Trash2 className="size-icon-sm" aria-hidden="true" />
          {t('bank.deleteConfirm')}
        </Button>
      </div>
    </Modal>
  )
}

// D-040, Q-054: copying a library entry asks for the copy's own code.
export function CopyDialog({ entryCode, onClose, onCopy }: { entryCode: string; onClose: () => void; onCopy: (code: string) => Promise<void> }) {
  const { t } = useTranslation()
  const [code, setCode] = useState(entryCode.replace(/^LIB-/, ''))
  const [error, setError] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const problem = checkCode(code.trim())
    setError(problem)
    if (problem) return
    setBusy(true)
    setFailed(false)
    try {
      await onCopy(code.trim())
      onClose()
    } catch (e) {
      setBusy(false)
      if (e instanceof ApiError && e.status === 422 && e.fields.code) setError(e.fields.code[0])
      else setFailed(true)
    }
  }

  return (
    <Modal title={t('bank.copyTitle', { code: entryCode })} onClose={onClose}>
      <form noValidate onSubmit={submit} className="grid gap-4">
        <TextField id="copy-code" label={t('bank.copyCode')} className="font-mono" maxLength={28} value={code} onChange={(e) => setCode(e.target.value)} error={codeError(t, error)} />
        <p className="text-caption text-secondary">{t('bank.copyHelp')}</p>
        {failed && <p className="text-caption text-error">{t('bank.failed')}</p>}
        <div className="flex flex-wrap justify-end gap-3">
          <Button onClick={onClose}>{t('bank.cancel')}</Button>
          <Button type="submit" variant="primary" disabled={busy}>{t('bank.copyButton')}</Button>
        </div>
      </form>
    </Modal>
  )
}
