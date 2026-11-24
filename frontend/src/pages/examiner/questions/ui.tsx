import type { ReactNode, TextareaHTMLAttributes } from 'react'
import { focusRing } from '../../../components/styles'

// Small pieces the question editor repeats (mock.css .btn-ghost, .seg, .textarea, .field).

export const ghostClass = `inline-flex min-h-hit items-center gap-2 rounded-md px-3 font-medium text-accent hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`
export const inputClass = `min-h-hit w-full rounded-md border border-input bg-surface px-3 py-2 text-primary placeholder:text-muted ${focusRing}`

/** A segmented choice (mock.css `.seg`): buttons with aria-pressed. */
export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <div role="group" aria-label={label} className="inline-flex overflow-hidden rounded-md border border-input">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={`min-h-hit border-l border-subtle bg-surface px-3 font-medium first:border-l-0 aria-pressed:bg-primary-subtle aria-pressed:font-semibold aria-pressed:text-accent ${focusRing}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string
  label: ReactNode
  help?: ReactNode
  error?: ReactNode
}

export function TextAreaField({ id, label, help, error, className = '', ...props }: TextAreaFieldProps) {
  const describedBy = [error && `${id}-error`, help && `${id}-help`].filter(Boolean).join(' ') || undefined
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        rows={props.rows ?? 4}
        className={`${inputClass} resize-y ${error ? 'border-error' : ''} ${className}`}
        {...props}
      />
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
