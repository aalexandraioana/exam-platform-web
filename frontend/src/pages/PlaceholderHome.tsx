import { useTranslation } from 'react-i18next'
import type { Role } from '../api/auth'
import { useAuth } from '../auth/context'

// TEMPORARY (P2): a role's home until its own part replaces it: P3 the Examiner's
// classes screen, P7 the Candidate dashboard, P11 the Administrator screens. No mock,
// no screenshot. Log-out is in the AppHeader above it.
export default function PlaceholderHome({ role }: { role: Role }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  return (
    <main className="grid flex-1 content-start justify-items-center px-4 py-6 tablet:py-12">
      <div className="grid w-full max-w-auth gap-2">
        <h1 className="text-display">{t(`home.${role}`)}</h1>
        <p className="text-secondary">{user?.name}</p>
      </div>
    </main>
  )
}
