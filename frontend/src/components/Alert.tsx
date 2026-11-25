import type { LucideIcon } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant: 'error' | 'info' | 'success' | 'warning'
  icon: LucideIcon
  /** A button shown at the end of the alert, e.g. "Try again". */
  action?: ReactNode
}

const tones = {
  error: { box: 'border-error bg-error-bg', icon: 'text-error' },
  info: { box: 'border-info bg-info-bg', icon: 'text-info' },
  success: { box: 'border-success bg-success-bg', icon: 'text-success' },
  warning: { box: 'border-warning bg-warning-bg', icon: 'text-warning' },
}

// mock.css `.alert`: the icon sits on the first text line (a line-high box), or is
// centred with the text when the alert has an action.
export default function Alert({ variant, icon: Icon, action, children, className = '', ...props }: AlertProps) {
  const tone = tones[variant]
  return (
    <div
      className={`flex gap-3 rounded-md border px-4 py-3 ${action ? 'items-center' : 'items-start'} ${tone.box} ${className}`}
      {...props}
    >
      <span className="flex h-6 shrink-0 items-center">
        <Icon className={`size-icon-md ${tone.icon}`} aria-hidden="true" />
      </span>
      {action ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3">
          <span>{children}</span>
          {action}
        </div>
      ) : (
        <span>{children}</span>
      )}
    </div>
  )
}
