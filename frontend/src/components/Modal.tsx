import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

interface ModalProps {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  /** `drawer`: a panel on the right edge (the mobile menu, mock.js `.drawer`); `sheet`: a panel
   * at the bottom (DS-004's navigator on phones). */
  variant?: 'dialog' | 'drawer' | 'sheet'
  /** Shown next to the title, e.g. the drawer's close button. */
  titleAction?: ReactNode
  /** `alertdialog` for a confirmation of something that can't be undone. */
  role?: 'dialog' | 'alertdialog'
}

// mock.css `.backdrop` + `.modal`: focus moves into the dialog, Tab stays inside, Escape
// closes it, and focus goes back to what opened it.
export default function Modal({ title, onClose, children, variant = 'dialog', titleAction, role = 'dialog' }: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    return () => opener?.focus()
  }, [])

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const drawer = variant === 'drawer'
  const sheet = variant === 'sheet'
  const heading = (
    <h2 id={titleId} className={drawer || sheet ? 'text-h3' : 'text-h2'}>
      {title}
    </h2>
  )
  return (
    <div
      className={`fixed inset-0 z-50 bg-overlay ${drawer ? 'flex justify-end' : sheet ? 'flex items-end' : 'grid place-items-center p-4'}`}
      onClick={(event) => event.target === event.currentTarget && (drawer || sheet) && onClose()}
    >
      <div
        ref={dialogRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className={
          drawer
            ? 'grid h-full w-full max-w-auth content-start gap-4 overflow-y-auto bg-surface p-4 shadow-modal'
            : sheet
              ? 'grid max-h-full w-full content-start gap-4 overflow-y-auto rounded-t-lg bg-surface p-4 shadow-modal'
              : 'grid max-h-full w-full max-w-auth gap-4 overflow-y-auto rounded-lg bg-surface p-6 shadow-modal'
        }
      >
        {titleAction ? (
          <div className="flex items-center justify-between gap-3">
            {heading}
            {titleAction}
          </div>
        ) : (
          heading
        )}
        {children}
      </div>
    </div>
  )
}
