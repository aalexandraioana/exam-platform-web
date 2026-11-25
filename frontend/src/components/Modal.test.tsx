import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import Modal from './Modal'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Deschide</button>
      {open && (
        <Modal title="Clasă nouă" onClose={() => setOpen(false)}>
          <input aria-label="Numele clasei" />
          <button type="button">Creează clasa</button>
        </Modal>
      )}
    </>
  )
}

describe('Modal', () => {
  it('is a labelled dialog that takes focus, closes on Escape and gives focus back', () => {
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Deschide' })
    opener.focus()

    fireEvent.click(opener)
    const dialog = screen.getByRole('dialog', { name: 'Clasă nouă' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByLabelText('Numele clasei')).toHaveFocus()

    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('keeps Tab inside the dialog', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Deschide' }))
    const last = screen.getByRole('button', { name: 'Creează clasa' })
    last.focus()

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' })
    expect(screen.getByLabelText('Numele clasei')).toHaveFocus()

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
  })
})

describe('Modal as a bottom sheet (DS-004 navigator on phones)', () => {
  it('sits at the bottom and closes from its backdrop', () => {
    const onClose = vi.fn()
    render(<Modal title="Itemi" variant="sheet" onClose={onClose}><button type="button">1</button></Modal>)

    const sheet = screen.getByRole('dialog', { name: 'Itemi' })
    expect(sheet.parentElement).toHaveClass('items-end')
    fireEvent.click(sheet.parentElement!)
    expect(onClose).toHaveBeenCalled()
  })
})
