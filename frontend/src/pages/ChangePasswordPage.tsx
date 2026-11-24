import { LoaderCircle, WifiOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Navigate } from 'react-router'
import { ApiError } from '../api/client'
import { homePath, useAuth } from '../auth/context'
import Alert from '../components/Alert'
import Button from '../components/Button'
import PasswordField from '../components/PasswordField'
import SessionLoading from '../components/SessionLoading'
import { linkClass } from '../components/styles'
import { useFocusFirstInvalid } from '../components/useFocusFirstInvalid'

type Errors = Partial<Record<'password' | 'confirmation', string>>

const MIN_PASSWORD = 8
const strong = { strong: <strong /> }

// DS-018 (docs/design/mocks/DS-018.html): the user replaces a temporary password before
// anything else (D-054). After the change they go to their home.
export default function ChangePasswordPage() {
  const { t } = useTranslation()
  const { user, status, changePassword, logout } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const formRef = useFocusFirstInvalid(errors)
  const [offline, setOffline] = useState(false)
  const [loading, setLoading] = useState(false)

  if (status === 'loading') return <SessionLoading />
  if (!user) return <Navigate to="/login" replace />
  if (!user.must_change_password) return <Navigate to={homePath(user.role)} replace />

  async function attempt() {
    setOffline(false)
    setLoading(true)
    try {
      await changePassword(password, confirmation)
    } catch (error) {
      setLoading(false)
      const code = error instanceof ApiError && error.status === 422 ? error.fields.password?.[0] : undefined
      if (code === 'mismatch') setErrors({ confirmation: code })
      else if (code) setErrors({ password: code })
      else setOffline(true)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const found: Errors = {}
    if (!password) found.password = 'required'
    else if (password.length < MIN_PASSWORD) found.password = 'too_short'
    if (confirmation !== password) found.confirmation = 'mismatch'
    setErrors(found)
    if (Object.keys(found).length === 0) attempt()
  }

  const passwordError =
    errors.password === 'too_short'
      ? t('register.passwordShort', { count: password.length })
      : errors.password === 'same_as_temporary'
        ? t('changePassword.same')
        : errors.password && t('errors.passwordRequired')

  return (
    <main className="grid flex-1 items-start justify-items-center px-4 py-6 tablet:py-12">
      <div className="grid w-full max-w-auth gap-6">
        <div className="grid gap-2">
          <h1 className="text-display">{t('changePassword.title')}</h1>
          <p className="text-secondary">{t('changePassword.intro', { name: user.first_name })}</p>
        </div>

        <section className="grid gap-4 rounded-lg border border-subtle bg-surface p-6 shadow-subtle">
          {offline && (
            <Alert variant="error" icon={WifiOff} role="alert" action={<Button onClick={attempt}>{t('errors.retry')}</Button>}>
              <Trans i18nKey="changePassword.offline" components={strong} />
            </Alert>
          )}

          <form ref={formRef} noValidate onSubmit={submit} className="grid gap-4">
            <PasswordField
              id="new-password"
              label={t('changePassword.field')}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={passwordError}
              help={errors.password ? undefined : t('changePassword.help')}
            />
            <PasswordField
              id="new-password-confirmation"
              label={t('register.confirmation')}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              error={errors.confirmation && t('register.mismatch')}
            />
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? (
                <>
                  <LoaderCircle className="size-icon-md animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  {t('changePassword.submitting')}
                </>
              ) : (
                t('changePassword.submit')
              )}
            </Button>
          </form>
        </section>

        <p className="text-center">
          {t('changePassword.notNow')}{' '}
          <button type="button" onClick={() => logout()} className={linkClass}>
            {t('header.logout')}
          </button>
        </p>
      </div>
    </main>
  )
}
