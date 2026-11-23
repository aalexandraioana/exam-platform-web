import type { ButtonHTMLAttributes } from 'react'
import { focusRing } from './styles'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  /** A square icon-only button (mock.css `.btn-icon`); give it an aria-label. */
  iconOnly?: boolean
}

const variants = {
  primary: 'border-transparent bg-primary font-semibold text-on-primary hover:bg-primary-hover',
  secondary: 'border-strong bg-surface font-medium text-primary hover:bg-surface-subtle',
}

// mock.css `.btn`, `.btn-primary`, `.btn-icon`.
export default function Button({ variant = 'secondary', iconOnly = false, type = 'button', className = '', ...props }: ButtonProps) {
  const shape = iconOnly ? 'w-hit p-0' : 'px-4 py-2'
  return (
    <button
      type={type}
      className={`inline-flex min-h-hit items-center justify-center gap-2 rounded-md border transition duration-fast disabled:cursor-not-allowed disabled:opacity-50 ${shape} ${variants[variant]} ${focusRing} ${className}`}
      {...props}
    />
  )
}
