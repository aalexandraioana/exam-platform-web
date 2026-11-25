import type { ReactNode } from 'react'

// mock.css `.modal-actions`: a dialog's buttons share the row in equal halves. A third action
// (e.g. delete) takes a row of its own with `className="col-span-2"`.
export default function DialogActions({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 [&>*]:w-full [&>*]:text-center">{children}</div>
}
