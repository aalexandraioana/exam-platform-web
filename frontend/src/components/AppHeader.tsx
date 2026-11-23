import { BookOpenText, LogOut, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useAuth } from '../auth/context'
import { currentTheme, setTheme, type Theme } from '../theme'
import Button from './Button'
import { focusRing } from './styles'

const languages = ['ro', 'en'] as const

// mock.css `.app-header` (auth screens: the toggles stay visible on mobile too).
export default function AppHeader() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const [theme, setThemeState] = useState<Theme>(currentTheme)

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-subtle bg-surface px-4 tablet:px-6">
      <Link to="/" className={`flex min-w-0 items-center gap-2 rounded-md font-bold text-primary no-underline ${focusRing}`}>
        <BookOpenText className="size-icon-lg shrink-0" aria-hidden="true" />
        {t('app.name')}
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <div role="group" aria-label={t('header.language')} className="inline-flex rounded-md border border-input">
          {languages.map((language) => (
            <button
              key={language}
              type="button"
              aria-pressed={i18n.resolvedLanguage === language}
              onClick={() => i18n.changeLanguage(language)}
              className={`min-h-hit min-w-hit bg-surface text-caption font-semibold text-secondary first:rounded-l-md last:rounded-r-md aria-pressed:bg-primary-subtle aria-pressed:text-accent ${focusRing}`}
            >
              {language.toUpperCase()}
            </button>
          ))}
        </div>
        <Button iconOnly aria-label={t('header.theme')} onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="size-icon-md" aria-hidden="true" /> : <Moon className="size-icon-md" aria-hidden="true" />}
        </Button>
        {user && (
          <Button onClick={() => logout()}>
            <LogOut className="size-icon-sm" aria-hidden="true" />
            <span className="sr-only tablet:not-sr-only">{t('header.logout')}</span>
          </Button>
        )}
      </div>
    </header>
  )
}
