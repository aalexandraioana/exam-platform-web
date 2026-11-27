import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setToken } from '../../api/client'
import { AuthProvider } from '../../auth/AuthProvider'
import { candidate, json, mockApi } from '../../test/mockApi'
import ResultsPage from './ResultsPage'

function renderAt(path = '/candidate/exams/4/results') {
  setToken('1|t')
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/candidate/exams/:id/results" element={<ResultsPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

const s1 = [
  { position: 1, section: 'subject_1', type: 'single_choice', points: 5, statement: 'Trei sferturi din 48 reprezintă …', options: ['12', '36', '32', '64'],
    answer: 2, awarded_points: 5, correct: 2, explanation: 'Un sfert din 48 este 12, deci trei sferturi sunt 36.' },
  { position: 4, section: 'subject_1', type: 'short_answer', points: 5, statement: 'Numărul a este egal cu …', options: [], answer: '20', awarded_points: 0, correct: '12', explanation: null },
  { position: 5, section: 'subject_1', type: 'dual_choice', points: 5, statement: 'Orice număr întreg negativ este mai mic decât 0.', options: [], answer: null, awarded_points: 0, correct: true, explanation: null },
]
const s2 = [
  { position: 7, section: 'subject_2', type: 'structured_problem', points: 20, statement: 'În triunghiul ABC, AB = AC. Calculează ∢B.', options: [],
    answer: 'a) ∢B = 70°', awarded_points: 14, images: [{ id: 9, position: 1, name: 'pagina-1.jpg', size: 1000 }], adjustment: 1,
    comment: 'La b) lipsește concluzia BD = DC.', uses_barem: true,
    barem: [{ description: 'Triunghi isoscel ⇒ ∢B = ∢C', points: 3, earned: 3 }, { description: 'BD = DC ⇒ AD mediană', points: 5, earned: 0 }] },
  { position: 8, section: 'subject_2', type: 'structured_problem', points: 20, statement: 'Calculează unghiurile.', options: [], answer: '∢AOB = 135°',
    awarded_points: 16, images: [], adjustment: null, comment: 'Corect, dar explică de ce suma este 180°.', uses_barem: false, barem: [] },
  { position: 9, section: 'subject_2', type: 'structured_problem', points: 20, statement: 'Cât costă produsul?', options: [], answer: null,
    awarded_points: 0, images: [], adjustment: null, comment: null, uses_barem: false, barem: [] },
]
const attempt = (id: number, number: number, grade: number, counted: boolean, extra = {}) => ({
  id, attempt_number: number, submitted_at: '2026-11-30T07:48:00Z', auto_submitted: false, subject_1_score: 25, subject_2_score: 44,
  total_score: grade * 10, grade, counted, items: [...s1, ...s2], ...extra,
})
const results = (attempts = [attempt(51, 1, 7.9, true)]) => ({
  exam: { id: 4, title: 'Evaluare Unitatea 3', score_policy: 'highest', results_published_at: '2026-12-01T16:20:00Z', cohort_note: 'Scrieți concluzia fiecărei demonstrații.' },
  attempts,
})
const base = { 'GET /user': json(200, { user: candidate }), 'GET /attempts/51/images/9': () => new Response(new Blob(['x'], { type: 'image/jpeg' })) }

beforeEach(() => {
  localStorage.clear()
  URL.createObjectURL = vi.fn(() => 'blob:photo')
  URL.revokeObjectURL = vi.fn()
})

describe('ResultsPage (DS-005, P8b)', () => {
  it('shows the grade, the scores and the cohort note (D-019, Q-085)', async () => {
    mockApi({ ...base, 'GET /candidate/exams/4/results': json(200, results()) })
    renderAt()

    expect(await screen.findByRole('heading', { level: 1, name: 'Evaluare Unitatea 3' })).toBeInTheDocument()
    expect(screen.getByText('Rezultate publicate pe 01.12.2026, ora 18:20')).toBeInTheDocument()
    expect(screen.getByTestId('grade')).toHaveTextContent('7,90')
    const scores = screen.getByRole('definition', { name: 'Total' })
    expect(scores).toHaveTextContent('79 / 100')
    expect(screen.getByRole('definition', { name: 'Subiectul I' })).toHaveTextContent('25 / 30')
    expect(screen.getByRole('definition', { name: 'Subiectul II' })).toHaveTextContent('44 / 60')
    expect(screen.getByText('Scrieți concluzia fiecărei demonstrații.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tablou de bord' })).toHaveAttribute('href', '/candidate')
    // Q-085: no class statistics (the Examiner's "Media: … · mediana: …"); "mediană" in a barem step is not one.
    expect(screen.queryByText(/Media:|mediana:/)).not.toBeInTheDocument()
  })

  it('shows each Subject I item with the answer, the correct answer, the points and the explanation (Q-082)', async () => {
    mockApi({ ...base, 'GET /candidate/exams/4/results': json(200, results()) })
    renderAt()

    const one = await screen.findByRole('article', { name: 'Itemul 1' })
    expect(within(one).getByText('5 / 5')).toBeInTheDocument()
    expect(within(one).getByRole('listitem', { name: /36/ })).toHaveTextContent('Răspunsul tău · corect')
    expect(within(one).getByText(/Un sfert din/)).toBeInTheDocument()

    const four = screen.getByRole('article', { name: 'Itemul 4' })
    expect(within(four).getByText('0 / 5')).toBeInTheDocument()
    expect(within(four).getByRole('definition', { name: 'Răspunsul tău' })).toHaveTextContent('20')
    expect(within(four).getByRole('definition', { name: 'Răspuns corect' })).toHaveTextContent('12')

    const five = screen.getByRole('article', { name: 'Itemul 5' })
    expect(within(five).getByRole('definition', { name: 'Răspunsul tău' })).toHaveTextContent('Fără răspuns')
    expect(within(five).getByRole('definition', { name: 'Răspuns corect' })).toHaveTextContent('Adevărat')
  })

  it('shows each Subject II problem with the steps, photos, barem points, adjustment and comment (Q-083)', async () => {
    mockApi({ ...base, 'GET /candidate/exams/4/results': json(200, results()) })
    renderAt()

    const seven = await screen.findByRole('article', { name: 'Problema 7' })
    expect(within(seven).getByText('14 / 20')).toBeInTheDocument()
    expect(within(seven).getByText('a) ∢B = 70°')).toBeInTheDocument()
    expect(await within(seven).findByRole('img', { name: 'Fotografia 1 din 1' })).toHaveAttribute('src', 'blob:photo')
    expect(within(seven).getByRole('listitem', { name: /BD = DC/ })).toHaveTextContent('0 / 5')
    expect(within(seven).getByRole('listitem', { name: 'Ajustare' })).toHaveTextContent('+1')
    expect(within(seven).getByText(/La b\) lipsește concluzia/)).toBeInTheDocument()

    const eight = screen.getByRole('article', { name: 'Problema 8' })
    expect(within(eight).getByText('Corectată fără barem: un singur punctaj pentru toată problema.')).toBeInTheDocument()
    expect(within(screen.getByRole('article', { name: 'Problema 9' })).getByText('Nu ai scris nimic și nu ai încărcat fotografii.')).toBeInTheDocument()
  })

  it('lists several Attempts, opens on the counted one and switches between them (D-012, Q-084)', async () => {
    mockApi({ ...base, 'GET /candidate/exams/4/results': json(200, results([
      attempt(50, 1, 6.4, false, { subject_1_score: 20, subject_2_score: 34 }), attempt(51, 2, 7.9, true),
    ])) })
    renderAt()

    const nav = await screen.findByRole('navigation', { name: 'Încercările tale' })
    expect(within(nav).getByRole('button', { name: /Încercarea 2.*7,90.*contează/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('grade')).toHaveTextContent('7,90')
    expect(screen.getByText('Contează nota cea mai mare dintre încercări.')).toBeInTheDocument()

    fireEvent.click(within(nav).getByRole('button', { name: /Încercarea 1/ }))
    expect(screen.getByTestId('grade')).toHaveTextContent('6,40')
    expect(screen.getByRole('definition', { name: 'Subiectul I' })).toHaveTextContent('20 / 30')
  })

  it('says when the results are not published yet', async () => {
    mockApi({ ...base, 'GET /candidate/exams/4/results': json(409, { code: 'results_not_published' }) })
    renderAt()

    expect(await screen.findByRole('heading', { level: 1, name: 'Rezultatele nu sunt publicate încă' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Înapoi la tabloul de bord' })).toHaveAttribute('href', '/candidate')
  })

  it('offers to try again when the results do not load', async () => {
    mockApi({ ...base, 'GET /candidate/exams/4/results': json(500, {}) })
    renderAt()

    expect(await screen.findByRole('alert')).toHaveTextContent('Nu am putut încărca rezultatele.')
    mockApi({ ...base, 'GET /candidate/exams/4/results': json(200, results()) })
    fireEvent.click(screen.getByRole('button', { name: 'Încearcă din nou' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Evaluare Unitatea 3' })).toBeInTheDocument()
  })
})
