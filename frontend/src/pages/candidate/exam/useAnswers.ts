import { useCallback, useEffect, useRef, useState } from 'react'
import { saveAnswer, type AnswerValue, type AttemptItem } from '../../../api/attempts'
import { ApiError } from '../../../api/client'

export interface LocalAnswer {
  value: AnswerValue
  marked: boolean
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'failed'

export const isAnswered = (answer?: LocalAnswer) => answer !== undefined && answer.value !== null

const TYPING_PAUSE_MS = 800

/**
 * Autosave for the exam room (P7b, C-006). Each item's saves are numbered from the server's last
 * version and sent one at a time; while one is on its way, only the newest change waits behind it.
 * Typed text waits for a pause; choices and the review mark go at once. A `409 time_up` or
 * `attempt_submitted` locks the room. P7d adds keeping unsent answers on the device.
 */
export function useAnswers(attemptId: number, items: AttemptItem[] | null) {
  const [answers, setAnswers] = useState<Record<number, LocalAnswer>>({})
  const [busy, setBusy] = useState(0)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [failed, setFailed] = useState<number[]>([])
  const [closed, setClosed] = useState(false)
  const latest = useRef<Record<number, LocalAnswer>>({})
  const versions = useRef<Record<number, number>>({})
  const inFlight = useRef(new Set<number>())
  const waiting = useRef(new Set<number>())
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const locked = useRef(false)

  // The saved answers are taken in the same render the Attempt arrives in (resume after a refresh).
  const [source, setSource] = useState<AttemptItem[] | null>(null)
  if (items && items !== source) {
    setSource(items)
    setAnswers(Object.fromEntries(items.map((item) => [item.position, { value: item.answer?.value ?? null, marked: item.answer?.marked_for_review ?? false }])))
  }
  useEffect(() => {
    if (!source) return
    versions.current = Object.fromEntries(source.map((item) => [item.position, item.answer?.version ?? 0]))
    latest.current = Object.fromEntries(source.map((item) => [item.position, { value: item.answer?.value ?? null, marked: item.answer?.marked_for_review ?? false }]))
  }, [source])

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), [])

  const send = useCallback(async function send(position: number): Promise<void> {
    if (locked.current) return
    if (inFlight.current.has(position)) {
      waiting.current.add(position)
      return
    }
    const local = latest.current[position]
    const version = (versions.current[position] ?? 0) + 1
    versions.current[position] = version
    inFlight.current.add(position)
    setBusy(inFlight.current.size)
    try {
      const result = await saveAnswer(attemptId, position, { answer: local.value, marked_for_review: local.marked, version })
      versions.current[position] = Math.max(version, result.answer.version)
      setFailed((list) => list.filter((p) => p !== position))
      setSavedAt(Date.now())
    } catch (error) {
      if (error instanceof ApiError && (error.code === 'time_up' || error.code === 'attempt_submitted')) {
        locked.current = true
        setClosed(true)
      } else {
        setFailed((list) => (list.includes(position) ? list : [...list, position]))
      }
    } finally {
      inFlight.current.delete(position)
      setBusy(inFlight.current.size)
      if (waiting.current.delete(position)) void send(position)
    }
  }, [attemptId])

  const change = useCallback((position: number, next: Partial<LocalAnswer>, typed = false) => {
    if (locked.current) return
    latest.current = { ...latest.current, [position]: { ...latest.current[position], ...next } }
    setAnswers(latest.current)
    clearTimeout(timers.current[position])
    delete timers.current[position]
    if (typed) {
      timers.current[position] = setTimeout(() => {
        delete timers.current[position]
        void send(position)
      }, TYPING_PAUSE_MS)
    } else {
      void send(position)
    }
  }, [send])

  /** Sends a typed answer now instead of after the pause (leaving the item). */
  const flush = useCallback((position: number) => {
    if (timers.current[position] === undefined) return
    clearTimeout(timers.current[position])
    delete timers.current[position]
    void send(position)
  }, [send])

  const retry = useCallback(() => failed.forEach((position) => void send(position)), [failed, send])

  const state: SaveState = busy > 0 ? 'saving' : failed.length > 0 ? 'failed' : savedAt ? 'saved' : 'idle'
  return { answers, change, flush, retry, state, savedAt, failed, closed }
}
