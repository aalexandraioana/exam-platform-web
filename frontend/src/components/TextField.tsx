import type { InputHTMLAttributes, ReactNode } from 'react'
import { focusRing } from './styles'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: ReactNode
  /** Shown in error colour under the input; marks the input invalid. */
  error?: ReactNode
  help?: ReactNode
  /** Shown at the end of the label row, e.g. a "Forgot your password?" button. */
  labelAside?: ReactNode
  /** Shown inside the input, at its end, e.g. the show-password button. */
  trailing?: ReactNode
}

// mock.css `.field`, `.input`, `.help`.
export default function TextField({ id, label, error, help, labelAside, trailing, className = '', ...props }: TextFieldProps) {
  const describedBy = [error && `${id}-error`, help && `${id}-help`].filter(Boolean).join(' ') || undefined
  const labelElement = (
    <label htmlFor={id} className="font-medium">
      {label}
    </label>
  )
  return (
    <div className="grid gap-1">
      {labelAside ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {labelElement}
          {labelAside}
        </div>
      ) : (
        labelElement
      )}
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`min-h-hit w-full rounded-md border bg-surface px-3 py-2 text-primary placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-error' : 'border-input'} ${trailing ? 'pr-12' : ''} ${focusRing} ${className}`}
          {...props}
        />
        {trailing}
      </div>
      {error && (
        <span id={`${id}-error`} className="text-caption text-error">
          {error}
        </span>
      )}
      {help && (
        <span id={`${id}-help`} className="text-caption text-secondary">
          {help}
        </span>
      )}
    </div>
  )
}
