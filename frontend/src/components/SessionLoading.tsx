import { Info, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import Alert from './Alert'

const WAKING_AFTER_MS = 5000
const strong = { strong: <strong /> }

// DS-016: shown while a saved session is checked (GET /api/user). The free API can take up to a
// minute to wake, so after 5 s the same notice as the login screen explains the wait.
export default function SessionLoading() {
  const { t } = useTranslation()
  const [waking, setWaking] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setWaking(true), WAKING_AFTER_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="grid flex-1 items-start justify-items-center px-4 py-16">
      <div role="status" aria-live="polite" className="grid w-full max-w-auth justify-items-center gap-4 text-center">
        <LoaderCircle className="size-icon-lg animate-spin text-accent motion-reduce:animate-none" aria-hidden="true" />
        <p className="text-body-medium text-primary">{t('session.loading')}</p>
        {waking && (
          <Alert variant="info" icon={Info} className="w-full text-left">
            <Trans i18nKey="login.waking" components={strong} />
          </Alert>
        )}
      </div>
    </main>
  )
}
