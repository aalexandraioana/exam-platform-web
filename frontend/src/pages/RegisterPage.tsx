import { CircleAlert, LoaderCircle, WifiOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router'
import { EMAIL_PATTERN } from '../api/auth'
import { ApiError } from '../api/client'
import { homePath, useAuth } from '../auth/context'
import Alert from '../components/Alert'
import Button from '../components/Button'
import PasswordField from '../components/PasswordField'
import TextField from '../components/TextField'
import { linkClass } from '../components/styles'

type Field = 'name' | 'email' | 'password' | 'confirmation' | 'class_code'
type Errors = Partial<Record<Field, string>>
type Banner = 'offline' | 'throttled'

const MIN_PASSWORD = 8
const strong = { strong: <strong /> }

// The 422 codes of C-001 (docs/API.md, POST /api/register) on the field that shows them.
function serverErrors(fields: Record<string, string[]>): Errors {
  const found: Errors = {}
  if (fields.name) found.name = fields.name[0]
  if (fields.email) found.email = fields.email[0]
  const password = fields.password?.[0]
  if (password === 'mismatch') found.confirmation = password
  else if (password) found.password = password
  if (fields.class_code) found.class_code = fields.class_code[0]
  return found
}

// DS-002 (docs/design/mocks/DS-002.html).
export default function RegisterPage() {
  const { t } = useTranslation()
  const { user, register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [classCode, setClassCode] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [summary, setSummary] = useState(0)
  const [banner, setBanner] = useState<Banner | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={homePath(user.role)} replace />

  async function attempt() {
    setBanner(null)
    setLoading(true)
    const code = classCode.trim()
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirmation,
        ...(code ? { class_code: code } : {}),
      })
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) setErrors(serverErrors(error.fields))
      else if (error instanceof ApiError && error.status === 429) setBanner('throttled')
      else setBanner('offline')
    } finally {
      setLoading(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const found: Errors = {}
    if (!name.trim()) found.name = 'required'
    if (!EMAIL_PATTERN.test(email.trim())) found.email = 'invalid'
    if (!password) found.password = 'required'
    else if (password.length < MIN_PASSWORD) found.password = 'too_short'
    if (confirmation !== password) found.confirmation = 'mismatch'
    setErrors(found)
    setSummary(Object.keys(found).length)
    if (Object.keys(found).length === 0) attempt()
  }

  const emailError =
    errors.email === 'taken' ? (
      <Trans
        i18nKey="register.emailTaken"
        components={{ link: <Link to="/login" className={linkClass} /> }}
      />
    ) : (
      errors.email && t('errors.email')
    )
  const passwordError =
    errors.password === 'too_short'
      ? t('register.passwordShort', { count: password.length })
      : errors.password && t('errors.passwordRequired')

  return (
    <main className="grid flex-1 items-start justify-items-center px-4 py-6 tablet:py-12">
      <div className="grid w-full max-w-auth gap-6">
        <div className="grid gap-2">
          <h1 className="text-display">{t('register.title')}</h1>
          <p className="text-secondary">{t('register.subtitle')}</p>
        </div>

        <section className="grid gap-4 rounded-lg border border-subtle bg-surface p-6 shadow-subtle">
          {banner === 'offline' ? (
            <Alert
              variant="error"
              icon={WifiOff}
              role="alert"
              action={<Button onClick={attempt}>{t('errors.retry')}</Button>}
            >
              <Trans i18nKey="register.offline" components={strong} />
            </Alert>
          ) : banner === 'throttled' ? (
            <Alert variant="error" icon={CircleAlert} role="alert">
              <Trans i18nKey="errors.throttled" components={strong} />
            </Alert>
          ) : summary > 0 ? (
            <Alert variant="error" icon={CircleAlert} role="alert">
              <Trans i18nKey="register.summary" count={summary} components={strong} />
            </Alert>
          ) : null}

          <form noValidate onSubmit={submit} className="grid gap-4">
            <TextField
              id="name"
              label={t('register.name')}
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={errors.name && t('register.nameRequired')}
            />
            <TextField
              id="email"
              type="email"
              label={t('register.email')}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={emailError}
            />
            <PasswordField
              id="password"
              label={t('register.password')}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={passwordError}
              help={errors.password ? undefined : t('register.passwordHelp')}
            />
            <PasswordField
              id="confirmation"
              label={t('register.confirmation')}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              error={errors.confirmation && t('register.mismatch')}
            />

            <hr className="border-subtle" />

            <TextField
              id="class-code"
              label={
                <>
                  {t('register.classCode')} <span className="font-normal text-secondary">{t('register.optional')}</span>
                </>
              }
              autoComplete="off"
              placeholder="K7Q-4MX"
              value={classCode}
              onChange={(event) => setClassCode(event.target.value)}
              error={errors.class_code && t('register.classCodeNotFound')}
              help={t('register.classCodeHelp')}
              className="font-mono uppercase tracking-code"
            />

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? (
                <>
                  <LoaderCircle className="size-icon-md animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  {t('register.submitting')}
                </>
              ) : (
                t('register.submit')
              )}
            </Button>
          </form>
        </section>

        <div className="grid gap-2 text-center">
          <p>
            {t('register.haveAccount')}{' '}
            <Link to="/login" className={linkClass}>
              {t('register.loginLink')}
            </Link>
          </p>
          <p className="text-caption text-secondary">{t('register.examinerNote')}</p>
        </div>
      </div>
    </main>
  )
}
