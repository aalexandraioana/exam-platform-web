import { CircleAlert } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import Alert from '../../../components/Alert'
import Button from '../../../components/Button'
import DialogActions from '../../../components/DialogActions'
import Modal from '../../../components/Modal'

const strong = { strong: <strong /> }

// DS-004 "Confirmare predare" (P7c): what is left unanswered or marked, and, if an answer isn't
// saved yet, a retry instead of submitting so nothing typed is lost.
export default function SubmitDialog({ answered, total, unanswered, marked, unsaved, busy, failed, onBack, onSubmit, onRetry }: {
  answered: number
  total: number
  unanswered: number[]
  marked: number[]
  unsaved: number[]
  busy: boolean
  failed: boolean
  onBack: () => void
  onSubmit: () => void
  onRetry: () => void
}) {
  const { t } = useTranslation()
  return (
    <Modal title={t('room.submitDialog.title')} onClose={onBack}>
      <p className="text-secondary"><Trans i18nKey="room.submitDialog.answered" values={{ answered, total }} components={strong} /></p>
      {unsaved.length > 0 && (
        <Alert variant="error" icon={CircleAlert} role="alert">
          <Trans i18nKey="room.submitDialog.unsaved" count={unsaved.length} values={{ list: unsaved.join(', ') }} components={strong} />
        </Alert>
      )}
      {failed && unsaved.length === 0 && <Alert variant="error" icon={CircleAlert} role="alert">{t('errors.offlineShort')}</Alert>}
      {(unanswered.length > 0 || marked.length > 0) && (
        <div className="grid gap-2">
          {unanswered.length > 0 && (
            <p className="rounded-md border border-warning bg-warning-bg px-4 py-3">
              <Trans i18nKey="room.submitDialog.unanswered" count={unanswered.length} values={{ list: unanswered.join(', ') }} components={strong} />
            </p>
          )}
          {marked.length > 0 && (
            <p className="rounded-md border border-subtle bg-surface-subtle px-4 py-3">
              <Trans i18nKey="room.submitDialog.marked" count={marked.length} values={{ list: marked.join(', ') }} components={strong} />
            </p>
          )}
        </div>
      )}
      {unsaved.length === 0 && <p className="text-caption text-secondary">{t('room.submitDialog.note')}</p>}
      <DialogActions>
        <Button onClick={onBack}>{t('room.submitDialog.back')}</Button>
        {unsaved.length > 0 ? (
          <Button variant="primary" disabled={busy} onClick={onRetry}>{t('errors.retry')}</Button>
        ) : (
          <Button variant="primary" disabled={busy} onClick={onSubmit}>{t('room.submit')}</Button>
        )}
      </DialogActions>
    </Modal>
  )
}
