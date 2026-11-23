import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import ro from './ro.json'

// <html lang> and the page title follow the language.
i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
  document.title = i18n.t('app.name')
})

// Romanian by default, English through the toggle (D-022, D-038).
i18n.use(initReactI18next).init({
  resources: { ro: { translation: ro }, en: { translation: en } },
  lng: 'ro',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes rendered text
})

export default i18n
