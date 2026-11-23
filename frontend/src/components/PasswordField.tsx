import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { focusRing } from './styles'
import TextField, { type TextFieldProps } from './TextField'

// mock.css `.pw-wrap`: a password input with a show/hide button inside it.
export default function PasswordField(props: Omit<TextFieldProps, 'type' | 'trailing'>) {
  const { t } = useTranslation()
  const [shown, setShown] = useState(false)
  const Icon = shown ? EyeOff : Eye
  return (
    <TextField
      {...props}
      type={shown ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          aria-label={shown ? t('password.hide') : t('password.show')}
          aria-pressed={shown}
          onClick={() => setShown(!shown)}
          className={`absolute right-0 top-0 inline-flex size-hit items-center justify-center rounded-md text-secondary ${focusRing}`}
        >
          <Icon className="size-icon-md" aria-hidden="true" />
        </button>
      }
    />
  )
}
