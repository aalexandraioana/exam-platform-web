import type { ReactNode, SelectHTMLAttributes } from 'react'
import { focusRing } from './styles'

/** The select's look, for selects without a label row (e.g. filters). PATTERN-002. */
export const selectClass = `select-native min-h-hit w-full rounded-md border border-input bg-surface px-3 py-2 text-primary hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string
  label: ReactNode
  error?: ReactNode
  help?: ReactNode
}

// mock.css `.field` + `.select`.
export default function SelectField({ id, label, error, help, className = '', children, ...props }: SelectFieldProps) {
  const describedBy = [error && `${id}-error`, help && `${id}-help`].filter(Boolean).join(' ') || undefined
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${selectClass} ${error ? 'border-error' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
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
