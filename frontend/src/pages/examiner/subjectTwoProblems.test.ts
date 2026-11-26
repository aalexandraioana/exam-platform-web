import { afterAll, describe, expect, it } from 'vitest'
import i18n from '../../i18n'
import { examProblemText } from './exams/problems'
import { problemText } from './questions/problems'

// D-062: Subject II is exactly 3 problems of 20 points; both problems read as sentences, in RO and EN.
describe('D-062 problem texts', () => {
  afterAll(() => i18n.changeLanguage('ro'))

  it('explains a Subject II question that is not worth 20 points', async () => {
    await i18n.changeLanguage('ro')
    expect(problemText(i18n.t, { code: 'subject_two_points', field: 'points' })).toBe('O problemă de la Subiectul II valorează 20 de puncte.')
    await i18n.changeLanguage('en')
    expect(problemText(i18n.t, { code: 'subject_two_points', field: 'points' })).toBe('A Subject II problem is worth 20 points.')
  })

  it('explains an exam without exactly 3 Subject II problems', async () => {
    await i18n.changeLanguage('ro')
    expect(examProblemText(i18n.t, { code: 'subject_two_items', count: 2, expected: 3 })).toBe('Subiectul II are 2 probleme; trebuie să aibă exact 3.')
    await i18n.changeLanguage('en')
    expect(examProblemText(i18n.t, { code: 'subject_two_items', count: 2, expected: 3 })).toBe('Subject II has 2 problems; it needs exactly 3.')
  })
})
