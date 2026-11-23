// Light or dark theme: the saved choice, else the system preference. The tokens in
// index.css switch on <html data-theme>.
export type Theme = 'light' | 'dark'

const THEME_KEY = 'theme'

function savedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    return saved === 'light' || saved === 'dark' ? saved : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

/** Applies the saved or system theme on start-up and returns it. */
export function initTheme(): Theme {
  const theme = savedTheme() ?? systemTheme()
  document.documentElement.dataset.theme = theme
  return theme
}

/** Applies a theme the user chose and saves it for the next visit. */
export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // storage unavailable: the choice lasts for this page only
  }
}
