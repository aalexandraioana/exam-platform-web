import { BookOpenText, LogOut, Menu, Moon, Sun, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router'
import type { Role } from '../api/auth'
import { useAuth } from '../auth/context'
import { currentTheme, setTheme, type Theme } from '../theme'
import Button from './Button'
import Modal from './Modal'
import { focusRing } from './styles'

const languages = ['ro', 'en'] as const

// The screens each role can open, in the mocks' order. Only built screens are listed (DS-007, DS-008, DS-013, DS-011).
const navigation: Partial<Record<Role, { label: string; links: { to: string; label: string }[] }>> = {
  examiner: { label: 'nav.examiner', links: [{ to: '/examiner/questions', label: 'nav.questions' }, { to: '/examiner/exams', label: 'nav.exams' }, { to: '/examiner', label: 'nav.classes' }] },
  administrator: { label: 'nav.administrator', links: [{ to: '/admin', label: 'nav.users' }] },
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-hit items-center rounded-md px-3 font-medium no-underline ${isActive ? 'bg-primary-subtle text-accent' : 'text-secondary'} ${focusRing}`

// mock.css `.app-header`. Signed out (auth screens) the toggles stay visible on mobile; signed in,
// the nav (if the role has one, DS-013), toggles and log-out move into the menu drawer below tablet
// width (DS-003 for the Candidate, who has no nav).
export default function AppHeader() {
  const { t, i18n } = useTranslation()
  const { user: signedIn, logout } = useAuth()
  // DS-018: while the password is temporary the header is the auth screens' one; the page
  // itself offers the log-out.
  const user = signedIn?.must_change_password ? null : signedIn
  const [theme, setThemeState] = useState<Theme>(currentTheme)
  const [menuOpen, setMenuOpen] = useState(false)
  const nav = user ? navigation[user.role] : undefined
  const links = nav?.links ?? []
  const hasNav = links.length > 0
  const desktopOnly = user ? 'hidden tablet:inline-flex' : ''

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  const languageToggle = (
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
  )

  const navLinks = links.map((link) => (
    <NavLink key={link.to} to={link.to} end className={navLinkClass} onClick={() => setMenuOpen(false)}>
      {t(link.label)}
    </NavLink>
  ))

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-subtle bg-surface px-4 tablet:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <Link to="/" className={`flex min-w-0 items-center gap-2 rounded-md font-bold text-primary no-underline ${focusRing}`}>
          <BookOpenText className="size-icon-lg shrink-0" aria-hidden="true" />
          {t('app.name')}
        </Link>
        {hasNav && (
          <nav aria-label={t(nav!.label)} className="hidden gap-1 tablet:flex">
            {navLinks}
          </nav>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className={desktopOnly}>{languageToggle}</div>
        <Button iconOnly aria-label={t('header.theme')} onClick={toggleTheme} className={desktopOnly}>
          {theme === 'dark' ? <Sun className="size-icon-md" aria-hidden="true" /> : <Moon className="size-icon-md" aria-hidden="true" />}
        </Button>
        {user && (
          <Button onClick={() => logout()} className={desktopOnly}>
            <LogOut className="size-icon-sm" aria-hidden="true" />
            {t('header.logout')}
          </Button>
        )}
        {user && (
          <Button iconOnly aria-label={t('nav.open')} className="tablet:hidden" onClick={() => setMenuOpen(true)}>
            <Menu className="size-icon-md" aria-hidden="true" />
          </Button>
        )}
      </div>
      {menuOpen && (
        <Modal
          variant="drawer"
          title={t('nav.menu')}
          onClose={() => setMenuOpen(false)}
          titleAction={
            <Button iconOnly aria-label={t('nav.close')} onClick={() => setMenuOpen(false)}>
              <X className="size-icon-md" aria-hidden="true" />
            </Button>
          }
        >
          {hasNav && (
            <>
              <nav aria-label={t(nav!.label)} className="grid gap-1">
                {navLinks}
              </nav>
              <hr className="border-subtle" />
            </>
          )}
          <div className="grid gap-2">
            <span className="font-medium">{t('header.language')}</span>
            <div>{languageToggle}</div>
          </div>
          <Button onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="size-icon-sm" aria-hidden="true" /> : <Moon className="size-icon-sm" aria-hidden="true" />}
            {t('header.theme')}
          </Button>
          <Button onClick={() => logout()}>
            <LogOut className="size-icon-sm" aria-hidden="true" />
            {t('header.logout')}
          </Button>
        </Modal>
      )}
    </header>
  )
}
