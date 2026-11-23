import { CircleAlert, Info, LoaderCircle, WifiOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation } from 'react-router'
import { EMAIL_PATTERN } from '../api/auth'
import { ApiError } from '../api/client'
import { homePath, useAuth } from '../auth/context'
import Alert from '../components/Alert'
import Button from '../components/Button'
import PasswordField from '../components/PasswordField'
import TextField from '../components/TextField'
import { linkClass } from '../components/styles'
import { useFocusFirstInvalid } from '../components/useFocusFirstInvalid'

// A free-tier server that slept takes up to a minute to answer (plan P2, assumption 4).
const WAKING_AFTER_MS = 5000

type Banner = 'wrong' | 'inactive' | 'throttled' | 'offline'
type Errors = { email?: string; password?: string }

const strong = { strong: <strong /> }

// DS-001 (docs/design/mocks/DS-001.html).
export default function LoginPage() {
  const { t } = useTranslation()
  const { user, login } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const formRef = useFocusFirstInvalid(errors)
  const [banner, setBanner] = useState<Banner | null>(null)
  const [loading, setLoading] = useState(false)
  const [waking, setWaking] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

  if (user) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
    return <Navigate to={from ?? homePath(user.role)} replace />
  }

  async function attempt() {
    setBanner(null)
    setLoading(true)
    const timer = setTimeout(() => setWaking(true), WAKING_AFTER_MS)
    try {
      await login({ email: email.trim(), password })
    } catch (error) {
      if (!(error instanceof ApiError)) setBanner('offline')
      else if (error.status === 429) setBanner('throttled')
      else if (error.status === 403 && error.code === 'account_inactive') setBanner('inactive')
      else if (error.status === 422 && error.fields.email?.includes('credentials')) setBanner('wrong')
      else if (error.status === 422) setErrors({ email: error.fields.email?.[0], password: error.fields.password?.[0] })
      else setBanner('offline')
    } finally {
      clearTimeout(timer)
      setLoading(false)
      setWaking(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const found: Errors = {}
    if (!EMAIL_PATTERN.test(email.trim())) found.email = 'invalid'
    if (!password) found.password = 'required'
    setErrors(found)
    if (Object.keys(found).length === 0) attempt()
  }

  return (
    <main className="grid flex-1 items-start justify-items-center px-4 py-6 tablet:py-12">
      <div className="grid w-full max-w-auth gap-6">
        <div className="grid gap-2">
          <h1 className="text-display">{t('login.title')}</h1>
          <p className="text-secondary">{t('login.subtitle')}</p>
        </div>

        <section className="grid gap-4 rounded-lg border border-subtle bg-surface p-6 shadow-subtle">
          {waking ? (
            <Alert variant="info" icon={Info} role="status">
              <Trans i18nKey="login.waking" components={strong} />
            </Alert>
          ) : banner === 'offline' ? (
            <Alert
              variant="error"
              icon={WifiOff}
              role="alert"
              action={<Button onClick={attempt}>{t('errors.retry')}</Button>}
            >
              <Trans i18nKey="errors.offline" components={strong} />
            </Alert>
          ) : banner ? (
            <Alert variant="error" icon={CircleAlert} role="alert">
              <Trans i18nKey={banner === 'throttled' ? 'errors.throttled' : `login.${banner}`} components={strong} />
            </Alert>
          ) : null}

          <form ref={formRef} noValidate onSubmit={submit} className="grid gap-4">
            <TextField
              id="email"
              type="email"
              label={t('login.email')}
              autoComplete="username"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email && t('errors.email')}
            />
            <PasswordField
              id="password"
              label={t('login.password')}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={errors.password && t('errors.passwordRequired')}
              labelAside={
                <button
                  type="button"
                  aria-expanded={forgotOpen}
                  aria-controls={forgotOpen ? 'forgot-note' : undefined}
                  onClick={() => setForgotOpen(!forgotOpen)}
                  className={`min-h-6 text-caption ${linkClass}`}
                >
                  {t('login.forgot')}
                </button>
              }
            />
            {forgotOpen && (
              <Alert id="forgot-note" variant="info" icon={Info}>
                {t('login.forgotNote')}
              </Alert>
            )}
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? (
                <>
                  <LoaderCircle className="size-icon-md animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  {t('login.submitting')}
                </>
              ) : (
                t('login.submit')
              )}
            </Button>
          </form>
        </section>

        <div className="grid gap-2 text-center">
          <p>
            {t('login.noAccount')}{' '}
            <Link to="/register" className={linkClass}>
              {t('login.registerLink')}
            </Link>
          </p>
          <p className="text-caption text-secondary">{t('login.examinerNote')}</p>
        </div>
      </div>
    </main>
  )
}
