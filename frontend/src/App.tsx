import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getHealth } from './api/client'

type ApiStatus = 'checking' | 'connected' | 'error'

const statusColor: Record<ApiStatus, string> = {
  checking: 'text-secondary',
  connected: 'text-success',
  error: 'text-error',
}

// Temporary P0 page proving the SPA reaches the API; replaced by the first screens in P2.
export default function App() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<ApiStatus>('checking')

  useEffect(() => {
    let active = true
    getHealth()
      .then((health) => active && setStatus(health.status === 'healthy' ? 'connected' : 'error'))
      .catch(() => active && setStatus('error'))
    return () => {
      active = false
    }
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-subtle bg-surface p-8 shadow-subtle">
        <h1 className="text-display text-primary">{t('app.name')}</h1>
        <p role="status" className={`mt-4 text-body-medium ${statusColor[status]}`}>
          {t(`status.${status}`)}
        </p>
      </div>
    </main>
  )
}
