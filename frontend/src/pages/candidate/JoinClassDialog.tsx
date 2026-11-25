import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { joinClass, type Membership } from '../../api/classes'
import { ApiError } from '../../api/client'
import Button from '../../components/Button'
import DialogActions from '../../components/DialogActions'
import Modal from '../../components/Modal'
import TextField from '../../components/TextField'

// DS-003 "Intră într-o clasă" (D-028, C-002 POST /memberships). The Examiner accepts the request.
export default function JoinClassDialog({ onClose, onJoined }: { onClose: () => void; onJoined: (membership: Membership) => void }) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const value = code.trim()
    if (!value) return setError(t('candidate.joinDialog.required'))
    setBusy(true)
    try {
      onJoined(await joinClass(value))
    } catch (failure) {
      const codes = failure instanceof ApiError ? failure.fields.class_code ?? [] : []
      setError(
        codes.includes('not_found') ? t('candidate.joinDialog.notFound')
          : codes.includes('required') ? t('candidate.joinDialog.required')
            : failure instanceof ApiError && failure.code === 'already_decided' ? t('candidate.joinDialog.declined')
              : t('candidate.joinDialog.failed'),
      )
      setBusy(false)
    }
  }

  return (
    <Modal title={t('candidate.joinDialog.title')} onClose={onClose}>
      <p className="text-secondary">{t('candidate.joinDialog.text')}</p>
      <form noValidate onSubmit={submit} className="grid gap-4">
        <TextField
          id="class-code"
          label={t('candidate.joinDialog.code')}
          placeholder={t('candidate.joinDialog.placeholder')}
          autoComplete="off"
          className="font-mono"
          value={code}
          error={error}
          onChange={(event) => { setCode(event.target.value); setError(null) }}
        />
        <DialogActions>
          <Button onClick={onClose}>{t('candidate.joinDialog.cancel')}</Button>
          <Button type="submit" variant="primary" disabled={busy}>{t('candidate.joinDialog.submit')}</Button>
        </DialogActions>
      </form>
    </Modal>
  )
}
