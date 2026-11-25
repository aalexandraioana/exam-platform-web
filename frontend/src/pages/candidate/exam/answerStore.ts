import type { AnswerValue } from '../../../api/attempts'

/**
 * The device copy of an Attempt's answers (P7d): written before each save is sent and marked
 * `waiting: false` once the server has it, so a refresh, a closed tab or a lost connection loses
 * nothing. `version` is the version the answer is (or will be) sent with. If storage is blocked
 * (private mode), the exam room works from memory only.
 */
export interface StoredAnswer {
  value: AnswerValue
  marked: boolean
  version: number
  waiting: boolean
}

const key = (attemptId: number) => `exam-answers-${attemptId}`

export function readStored(attemptId: number): Record<number, StoredAnswer> {
  try {
    return JSON.parse(localStorage.getItem(key(attemptId)) ?? '{}') as Record<number, StoredAnswer>
  } catch {
    return {}
  }
}

export function writeStored(attemptId: number, answers: Record<number, StoredAnswer>): void {
  try {
    localStorage.setItem(key(attemptId), JSON.stringify(answers))
  } catch {
    // memory only
  }
}

export function clearStored(attemptId: number): void {
  try {
    localStorage.removeItem(key(attemptId))
  } catch {
    // nothing stored
  }
}
