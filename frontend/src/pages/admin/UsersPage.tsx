import { CircleCheck, KeyRound, UserPlus, UserX, WifiOff } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { createExaminer, deactivateUser, listUsers, setTemporaryPassword } from '../../api/admin'
import { EMAIL_PATTERN, type User } from '../../api/auth'
import { ApiError } from '../../api/client'
import { useAuth } from '../../auth/context'
import Alert from '../../components/Alert'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import PasswordField from '../../components/PasswordField'
import TextField from '../../components/TextField'
import { focusRing } from '../../components/styles'
import { useFocusFirstInvalid } from '../../components/useFocusFirstInvalid'

const MIN_PASSWORD = 8
const strong = { strong: <strong /> }

type Dialog = { kind: 'password'; user: User } | { kind: 'deactivate'; user: User } | { kind: 'examiner' }
type Notice = { key: 'users.passwordDone' | 'users.createdDone'; name: string }

const byLastName = (a: User, b: User) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name)

// DS-011 (docs/design/mocks/DS-011.html): every user; temporary passwords (D-054), new Examiners
// (D-055) and deactivation of Candidates and Examiners, which is permanent (D-056).
export default function UsersPage() {
  const { t } = useTranslation()
  const { user: me } = useAuth()
  const [users, setUsers] = useState<User[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [loadKey, setLoadKey] = useState(0)
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    let active = true
    listUsers().then(
      (list) => active && setUsers(list),
      () => active && setLoadFailed(true),
    )
    return () => {
      active = false
    }
  }, [loadKey])

  function retry() {
    setLoadFailed(false)
    setLoadKey((key) => key + 1)
  }

  function replace(updated: User) {
    setUsers((list) => list?.map((u) => (u.id === updated.id ? updated : u)) ?? list)
  }

  const needle = query.trim().toLowerCase()
  const shown = (users ?? []).filter((u) => !needle || u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle))

  return (
    <main className="mx-auto grid w-full max-w-screen-wide content-start gap-6 px-4 pb-12 pt-6 tablet:px-6 tablet:pb-16 tablet:pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-display">{t('users.title')}</h1>
        {!loadFailed && (
          <Button variant="primary" onClick={() => setDialog({ kind: 'examiner' })}>
            <UserPlus className="size-icon-sm" aria-hidden="true" />
            {t('users.newExaminer')}
          </Button>
        )}
      </div>

      {notice && (
        <Alert variant="success" icon={CircleCheck} role="status">
          <Trans i18nKey={notice.key} values={{ name: notice.name }} components={strong} />
        </Alert>
      )}

      {loadFailed ? (
        <Alert variant="error" icon={WifiOff} role="alert" action={<Button onClick={retry}>{t('errors.retry')}</Button>}>
          <Trans i18nKey="users.loadFailed" components={strong} />
        </Alert>
      ) : (
        <section aria-label={t('users.title')} className="grid gap-4 overflow-hidden rounded-lg border border-subtle bg-surface pt-4 shadow-subtle">
          <div className="px-6">
            <input
              type="search"
              aria-label={t('users.search')}
              placeholder={t('users.search')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={`min-h-hit w-full rounded-md border border-input bg-surface px-3 py-2 text-primary placeholder:text-muted tablet:max-w-auth ${focusRing}`}
            />
          </div>
          {users === null ? (
            <div aria-busy="true" aria-label={t('users.loading')} className="grid gap-4 px-6 pb-6">
              {['w-3/5', 'w-4/5', 'w-1/2'].map((width) => (
                <div key={width} className={`h-4 animate-pulse rounded-sm bg-surface-subtle motion-reduce:animate-none ${width}`} />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <p className="px-6 pb-6 text-secondary">{t('users.noMatch', { query: query.trim() })}</p>
          ) : (
            <UsersTable
              users={shown}
              me={me}
              onPassword={(user) => setDialog({ kind: 'password', user })}
              onDeactivate={(user) => setDialog({ kind: 'deactivate', user })}
            />
          )}
        </section>
      )}

      {dialog?.kind === 'password' && (
        <PasswordDialog
          user={dialog.user}
          onClose={() => setDialog(null)}
          onSubmit={async (password) => {
            await setTemporaryPassword(dialog.user.id, password)
            replace({ ...dialog.user, must_change_password: true })
            setNotice({ key: 'users.passwordDone', name: dialog.user.name })
          }}
        />
      )}
      {dialog?.kind === 'examiner' && (
        <ExaminerDialog
          onClose={() => setDialog(null)}
          onCreated={(created) => {
            setUsers((list) => [...(list ?? []), created].sort(byLastName))
            setNotice({ key: 'users.createdDone', name: created.name })
          }}
        />
      )}
      {dialog?.kind === 'deactivate' && (
        <DeactivateDialog
          user={dialog.user}
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            replace(await deactivateUser(dialog.user.id))
            setNotice(null)
          }}
        />
      )}
    </main>
  )
}

function UsersTable({ users, me, onPassword, onDeactivate }: { users: User[]; me: User | null; onPassword: (user: User) => void; onDeactivate: (user: User) => void }) {
  const { t } = useTranslation()
  const cell = 'border-b border-subtle px-4 py-3 align-top group-last:border-b-0 max-tablet:block max-tablet:border-0 max-tablet:p-0'
  const head = 'border-b border-subtle bg-surface-subtle px-4 py-3 text-left text-caption font-semibold text-secondary'
  const role = (user: User) => t(`home.${user.role}`)
  const status = (user: User) => (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2 text-caption font-semibold ${user.is_active ? 'bg-success-bg text-success' : 'bg-surface-subtle text-secondary'}`}>
      {t(user.is_active ? 'users.active' : 'users.inactive')}
    </span>
  )

  return (
    <table className="w-full border-collapse">
      <thead className="max-tablet:hidden">
        <tr>
          <th className={head}>{t('users.colName')}</th>
          <th className={head}>{t('users.colRole')}</th>
          <th className={head}>{t('users.colStatus')}</th>
          <th className={`${head} w-px whitespace-nowrap`}>{t('users.colActions')}</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => {
          const isMe = user.id === me?.id
          const canPassword = user.is_active && !isMe
          const canDeactivate = user.is_active && user.role !== 'administrator'
          return (
            <tr key={user.id} className="group max-tablet:grid max-tablet:gap-3 max-tablet:border-b max-tablet:border-subtle max-tablet:px-4 max-tablet:py-3 max-tablet:last:border-b-0">
              <td className={cell}>
                <span className="grid">
                  <span className="font-medium [overflow-wrap:anywhere]">
                    {user.name}
                    {isMe && <span className="font-normal text-secondary"> {t('users.you')}</span>}
                  </span>
                  <span className="text-caption text-secondary [overflow-wrap:anywhere]">{user.email}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-caption text-secondary tablet:hidden">
                    {role(user)} {status(user)}
                  </span>
                </span>
              </td>
              <td className={`${cell} max-tablet:hidden`}>{role(user)}</td>
              <td className={`${cell} max-tablet:hidden`}>{status(user)}</td>
              <td className={`${cell} whitespace-nowrap`}>
                {!user.is_active ? (
                  <span className="text-caption text-secondary">{t('users.deactivatedNote')}</span>
                ) : (
                  (canPassword || canDeactivate) && (
                    <div className="flex flex-wrap items-center gap-2">
                      {canPassword && (
                        <Button aria-label={t('users.tempPasswordLabel', { name: user.name })} onClick={() => onPassword(user)}>
                          <KeyRound className="size-icon-sm" aria-hidden="true" />
                          {t('users.tempPassword')}
                        </Button>
                      )}
                      {canDeactivate && (
                        <button
                          type="button"
                          aria-label={t('users.deactivateLabel', { name: user.name })}
                          onClick={() => onDeactivate(user)}
                          className={`inline-flex min-h-hit items-center gap-2 rounded-md px-2 font-medium text-accent ${focusRing}`}
                        >
                          <UserX className="size-icon-sm" aria-hidden="true" />
                          {t('users.deactivate')}
                        </button>
                      )}
                    </div>
                  )
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/** The non-validation failures of an Administrator action: network, or a refusal (403/409). */
function failureText(error: unknown, t: (key: string) => string): string {
  return error instanceof ApiError && error.status === 0 ? t('errors.offlineShort') : t('users.failed')
}

function PasswordDialog({ user, onClose, onSubmit }: { user: User; onClose: () => void; onSubmit: (password: string) => Promise<void> }) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirmation?: boolean }>({})
  const formRef = useFocusFirstInvalid(errors)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const found: typeof errors = {}
    if (!password) found.password = t('errors.passwordRequired')
    else if (password.length < MIN_PASSWORD) found.password = t('register.passwordShort', { count: password.length })
    if (!found.password && confirmation !== password) found.confirmation = true
    setErrors(found)
    if (found.password || found.confirmation) return
    setBusy(true)
    try {
      await onSubmit(password)
      onClose()
    } catch (error) {
      setBusy(false)
      setErrors({ password: failureText(error, t) })
    }
  }

  return (
    <Modal title={t('users.tempPasswordLabel', { name: user.name })} onClose={onClose}>
      <p className="text-secondary">{t('users.passwordIntro', { name: user.name })}</p>
      <form ref={formRef} noValidate onSubmit={submit} className="grid gap-4">
        <PasswordField
          id="temporary-password"
          label={t('users.passwordField')}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          help={errors.password ? undefined : t('users.passwordHelp')}
        />
        <PasswordField
          id="temporary-password-confirmation"
          label={t('register.confirmation')}
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          error={errors.confirmation && t('register.mismatch')}
        />
        <div className="flex flex-wrap justify-end gap-3">
          <Button onClick={onClose}>{t('users.cancel')}</Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {t('users.setPassword')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

type ExaminerField = 'first_name' | 'last_name' | 'email' | 'password' | 'confirmation'

function ExaminerDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (user: User) => void }) {
  const { t } = useTranslation()
  const [values, setValues] = useState<Record<ExaminerField, string>>({ first_name: '', last_name: '', email: '', password: '', confirmation: '' })
  const [errors, setErrors] = useState<Partial<Record<ExaminerField, string>>>({})
  const formRef = useFocusFirstInvalid(errors)
  const [failed, setFailed] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const field = (name: ExaminerField) => ({
    value: values[name],
    onChange: (event: { target: { value: string } }) => setValues((v) => ({ ...v, [name]: event.target.value })),
  })

  async function submit(event: FormEvent) {
    event.preventDefault()
    const found: typeof errors = {}
    if (!values.first_name.trim()) found.first_name = 'required'
    if (!values.last_name.trim()) found.last_name = 'required'
    if (!EMAIL_PATTERN.test(values.email.trim())) found.email = 'invalid'
    if (!values.password) found.password = 'required'
    else if (values.password.length < MIN_PASSWORD) found.password = 'too_short'
    if (!found.password && values.confirmation !== values.password) found.confirmation = 'mismatch'
    setErrors(found)
    setFailed(null)
    if (Object.keys(found).length > 0) return
    setBusy(true)
    try {
      const created = await createExaminer({
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email.trim(),
        password: values.password,
      })
      onCreated(created)
      onClose()
    } catch (error) {
      setBusy(false)
      if (error instanceof ApiError && error.status === 422) {
        setErrors(Object.fromEntries(Object.entries(error.fields).map(([key, codes]) => [key, codes[0]])))
      } else {
        setFailed(failureText(error, t))
      }
    }
  }

  const nameError = (code: string | undefined, required: string) => code && t(code === 'invalid' ? 'register.nameTooLong' : required)
  const emailError = errors.email && t(errors.email === 'taken' ? 'users.emailTaken' : 'errors.email')
  const passwordError =
    errors.password === 'too_short'
      ? t('register.passwordShort', { count: values.password.length })
      : errors.password && t('errors.passwordRequired')

  return (
    <Modal title={t('users.newExaminer')} onClose={onClose}>
      <p className="text-secondary">{t('users.newIntro')}</p>
      <form ref={formRef} noValidate onSubmit={submit} className="grid gap-4">
        {failed && (
          <Alert variant="error" icon={WifiOff} role="alert">
            {failed}
          </Alert>
        )}
        <div className="grid gap-4 tablet:grid-cols-2">
          <TextField
            id="examiner-first-name"
            label={t('register.firstName')}
            autoComplete="off"
            placeholder="Maria"
            maxLength={100}
            {...field('first_name')}
            error={nameError(errors.first_name, 'users.firstNameRequired')}
          />
          <TextField
            id="examiner-last-name"
            label={t('register.lastName')}
            autoComplete="off"
            placeholder="Popa"
            maxLength={100}
            {...field('last_name')}
            error={nameError(errors.last_name, 'users.lastNameRequired')}
          />
        </div>
        <TextField
          id="examiner-email"
          type="email"
          label={t('register.email')}
          autoComplete="off"
          placeholder={t('login.emailPlaceholder')}
          {...field('email')}
          error={emailError}
        />
        <PasswordField
          id="examiner-password"
          label={t('users.passwordField')}
          autoComplete="new-password"
          {...field('password')}
          error={passwordError}
          help={errors.password ? undefined : t('users.passwordHelp')}
        />
        <PasswordField
          id="examiner-password-confirmation"
          label={t('register.confirmation')}
          autoComplete="new-password"
          {...field('confirmation')}
          error={errors.confirmation && t('register.mismatch')}
        />
        <div className="flex flex-wrap justify-end gap-3">
          <Button onClick={onClose}>{t('users.cancel')}</Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {t('users.create')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function DeactivateDialog({ user, onClose, onConfirm }: { user: User; onClose: () => void; onConfirm: () => Promise<void> }) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    setFailed(null)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      setBusy(false)
      setFailed(failureText(error, t))
    }
  }

  return (
    <Modal role="alertdialog" title={t('users.deactivateTitle', { name: user.name })} onClose={onClose}>
      <p className="text-secondary">{t('users.deactivateText', { name: user.name })}</p>
      {failed && (
        <Alert variant="error" icon={WifiOff} role="alert">
          {failed}
        </Alert>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        <Button onClick={onClose}>{t('users.cancel')}</Button>
        <Button variant="danger" onClick={confirm} disabled={busy}>
          <UserX className="size-icon-sm" aria-hidden="true" />
          {t('users.deactivateConfirm')}
        </Button>
      </div>
    </Modal>
  )
}
