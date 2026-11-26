import { Camera, CircleAlert, Trash2 } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { deleteImage, fetchImage, uploadImage, type AttemptImage, type AttemptItem } from '../../../api/attempts'
import { ApiError } from '../../../api/client'
import Alert from '../../../components/Alert'
import Button from '../../../components/Button'
import DialogActions from '../../../components/DialogActions'
import Modal from '../../../components/Modal'
import { focusRing } from '../../../components/styles'

const MAX = 3
const MAX_BYTES = 10 * 1024 * 1024
const ACCEPT = 'image/jpeg,image/png,image/heic,image/heif,.heic,.heif'
const strong = { strong: <strong /> }

const isHeic = (file: File) => /image\/hei[cf]/.test(file.type) || /\.(heic|heif)$/i.test(file.name)
const isAllowed = (file: File) => /image\/(jpeg|png)/.test(file.type) || /\.(jpe?g|png)$/i.test(file.name) || isHeic(file)

interface Upload {
  key: number
  file: File
  sent: number
  total: number
}

type Problem = { kind: 'tooLarge' | 'type'; name: string } | { kind: 'offline'; file: File } | { kind: 'delete' }

const slotShape = 'grid aspect-[3/4] place-items-center overflow-hidden rounded-md border border-strong p-3 text-center'
const slot = `${slotShape} bg-surface-subtle`

// DS-004 photo block (P6d, D-026): up to 3 handwritten-solution photos per Subject II problem,
// uploaded at once with progress (HEIC converted on the server), each with a labelled "Șterge"
// that asks first. Photos aren't kept on the device; offline, the upload offers a retry.
export default function PhotoTray({ attemptId, item, disabled, onCount, onClosed }: {
  attemptId: number
  item: AttemptItem
  disabled: boolean
  onCount: (count: number) => void
  onClosed: () => void
}) {
  const { t, i18n } = useTranslation()
  const titleId = useId()
  const input = useRef<HTMLInputElement>(null)
  const nextKey = useRef(0)
  const [images, setImages] = useState<AttemptImage[]>(() => [...(item.images ?? [])].sort((a, b) => a.position - b.position))
  const [urls, setUrls] = useState<Record<number, string>>({})
  const [uploads, setUploads] = useState<Upload[]>([])
  const [problem, setProblem] = useState<Problem | null>(null)
  const [confirm, setConfirm] = useState<AttemptImage | null>(null)

  useEffect(() => onCount(images.length), [images.length, onCount])

  useEffect(() => {
    let active = true
    for (const image of images) {
      if (urls[image.id]) continue
      fetchImage(attemptId, image.id).then(
        (blob) => active && setUrls((all) => ({ ...all, [image.id]: URL.createObjectURL(blob) })),
        () => undefined, // the name and size still show
      )
    }
    return () => {
      active = false
    }
  }, [images, urls, attemptId])

  const urlsRef = useRef(urls)
  useEffect(() => {
    urlsRef.current = urls
  }, [urls])
  useEffect(() => () => Object.values(urlsRef.current).forEach((url) => URL.revokeObjectURL(url)), [])

  const megabytes = (bytes: number) =>
    `${new Intl.NumberFormat(i18n.resolvedLanguage === 'en' ? 'en-GB' : 'ro-RO', { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024)} MB`

  function refused(error: unknown, file: File) {
    const code = error instanceof ApiError ? error.code : undefined
    if (code === 'time_up' || code === 'attempt_submitted') return onClosed()
    if (error instanceof ApiError && error.status === 0) return setProblem({ kind: 'offline', file })
    setProblem({ kind: code === 'image_too_large' ? 'tooLarge' : 'type', name: file.name })
  }

  async function send(file: File) {
    const key = nextKey.current++
    setProblem(null)
    setUploads((list) => [...list, { key, file, sent: 0, total: file.size }])
    try {
      const image = await uploadImage(attemptId, item.position, file, (sent, total) =>
        setUploads((list) => list.map((u) => (u.key === key ? { ...u, sent, total } : u))),
      )
      setImages((list) => [...list, image].sort((a, b) => a.position - b.position))
    } catch (error) {
      refused(error, file)
    } finally {
      setUploads((list) => list.filter((u) => u.key !== key))
    }
  }

  function chosen(file: File | undefined) {
    if (!file) return
    if (file.size > MAX_BYTES) return setProblem({ kind: 'tooLarge', name: file.name })
    if (!isAllowed(file)) return setProblem({ kind: 'type', name: file.name })
    void send(file)
  }

  async function remove(image: AttemptImage) {
    setConfirm(null)
    try {
      await deleteImage(attemptId, item.position, image.id)
      setImages((list) => list.filter((i) => i.id !== image.id))
    } catch (error) {
      const code = error instanceof ApiError ? error.code : undefined
      if (code === 'time_up' || code === 'attempt_submitted') return onClosed()
      setProblem({ kind: 'delete' })
    }
  }

  const pick = () => input.current?.click()
  const free = MAX - images.length - uploads.length

  let notice = null
  if (problem?.kind === 'tooLarge') {
    notice = <Trans i18nKey="room.photos.tooLarge" values={{ name: problem.name }} components={strong} />
  } else if (problem?.kind === 'type') {
    notice = t('room.photos.wrongType')
  } else if (problem?.kind === 'offline') {
    notice = t('room.photos.offline')
  } else if (problem?.kind === 'delete') {
    notice = t('errors.offlineShort')
  }
  const action = problem?.kind === 'offline'
    ? <Button onClick={() => void send(problem.file)}>{t('errors.retry')}</Button>
    : problem && problem.kind !== 'delete' ? <Button onClick={pick}>{t('room.photos.chooseOther')}</Button> : undefined

  return (
    <div role="group" aria-labelledby={titleId} className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span id={titleId} className="font-medium">{t('room.photos.title')}</span>
        <span className="shrink-0 whitespace-nowrap text-caption text-secondary">{t('room.photos.count', { count: images.length, max: MAX })}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 tablet:grid-cols-3">
        {images.map((image) => (
          <div key={image.id} className="grid content-start gap-2">
            <div className={slot}>
              {urls[image.id] && <img src={urls[image.id]} alt={t('room.photos.photo', { number: image.position })} className="size-full object-contain" />}
            </div>
            <span className="text-caption text-secondary [overflow-wrap:anywhere]">{image.name} · {megabytes(image.size)}</span>
            <Button className="w-full" disabled={disabled} aria-label={t('room.photos.deleteLabel', { number: image.position })} onClick={() => setConfirm(image)}>
              <Trash2 className="size-icon-sm" aria-hidden="true" />
              {t('room.photos.delete')}
            </Button>
          </div>
        ))}
        {uploads.map((upload) => {
          const percent = upload.total ? Math.min(100, Math.round((upload.sent / upload.total) * 100)) : 0
          const preparing = percent >= 100 && isHeic(upload.file)
          return (
            <div key={upload.key} className={slot}>
              <div className="grid w-full justify-items-center gap-2">
                <span className="font-medium [overflow-wrap:anywhere]">{upload.file.name}</span>
                <div role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={t('room.photos.uploading', { percent })} className="h-2 w-full overflow-hidden rounded-full bg-surface">
                  <span className="block h-full bg-primary" style={{ width: `${percent}%` }} />
                </div>
                <span className="text-caption text-secondary">{preparing ? t('room.photos.preparing') : t('room.photos.uploading', { percent })}</span>
              </div>
            </div>
          )
        })}
        {free > 0 && !disabled && (
          <button type="button" onClick={pick} className={`${slotShape} border-dashed bg-surface text-accent ${focusRing}`}>
            <span className="grid justify-items-center gap-2">
              <Camera className="size-icon-lg" aria-hidden="true" />
              <span className="font-medium">{t('room.photos.add')}</span>
            </span>
          </button>
        )}
      </div>
      <input ref={input} type="file" accept={ACCEPT} aria-label={t('room.photos.inputLabel')} tabIndex={-1} className="sr-only"
        onChange={(event) => { chosen(event.target.files?.[0]); event.target.value = '' }} />
      <span className="text-caption text-secondary">{t('room.photos.limits')}</span>
      {notice && <Alert variant="error" icon={CircleAlert} role="alert" action={action}>{notice}</Alert>}

      {confirm && (
        <Modal role="alertdialog" title={t('room.photos.confirmTitle', { number: confirm.position })} onClose={() => setConfirm(null)}>
          <p className="text-secondary">{t('room.photos.confirmText', { item: item.position })}</p>
          <DialogActions>
            <Button onClick={() => setConfirm(null)}>{t('room.photos.cancel')}</Button>
            <Button variant="danger" onClick={() => void remove(confirm)}>
              <Trash2 className="size-icon-sm" aria-hidden="true" />
              {t('room.photos.confirmDelete')}
            </Button>
          </DialogActions>
        </Modal>
      )}
    </div>
  )
}
