import { useCallback, useEffect, useRef, useState } from 'react'
import { saveAnswer, type AnswerValue, type AttemptItem } from '../../../api/attempts'
import { ApiError } from '../../../api/client'
import { clearStored, readStored, writeStored, type StoredAnswer } from './answerStore'

export interface LocalAnswer {
  value: AnswerValue
  marked: boolean
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'failed'

export const isAnswered = (answer?: LocalAnswer) => answer !== undefined && answer.value !== null

const TYPING_PAUSE_MS = 800
const RETRY_MAX_MS = 30_000

interface Resume {
  answers: Record<number, LocalAnswer>
  versions: Record<number, number>
  device: Record<number, StoredAnswer>
  resend: number[]
}

/** Server answers, overridden by a waiting device answer with a higher version (P7d). */
function resume(attemptId: number, items: AttemptItem[]): Resume {
  const stored = readStored(attemptId)
  const result: Resume = { answers: {}, versions: {}, device: {}, resend: [] }
  for (const item of items) {
    const server = { value: item.answer?.value ?? null, marked: item.answer?.marked_for_review ?? false, version: item.answer?.version ?? 0 }
    const local = stored[item.position]
    if (local?.waiting && local.version > server.version) {
      result.answers[item.position] = { value: local.value, marked: local.marked }
      result.versions[item.position] = local.version - 1 // the next send uses the stored version
      result.device[item.position] = local
      result.resend.push(item.position)
    } else {
      result.answers[item.position] = { value: server.value, marked: server.marked }
      result.versions[item.position] = server.version
    }
  }
  return result
}

/**
 * Autosave for the exam room (P7b–P7d, C-006). Each change is kept on the device first, then sent
 * with the item's next version, one save per item at a time (only the newest change waits). Typed
 * text waits for a pause; choices and the review mark go at once. A lost connection is retried by
 * itself (1, 2, 4… s, at most 30 s, and at once when the browser is back online); a server error
 * waits for "Încearcă din nou". `409 time_up` / `attempt_submitted` locks the room.
 */
export function useAnswers(attemptId: number, items: AttemptItem[] | null) {
  const [answers, setAnswers] = useState<Record<number, LocalAnswer>>({})
  const [busy, setBusy] = useState(0)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [failed, setFailed] = useState<number[]>([])
  const [network, setNetwork] = useState(false)
  const [waitingCount, setWaitingCount] = useState(0)
  const [closed, setClosed] = useState(false)
  const latest = useRef<Record<number, LocalAnswer>>({})
  const versions = useRef<Record<number, number>>({})
  const device = useRef<Record<number, StoredAnswer>>({})
  const inFlight = useRef(new Set<number>())
  const waiting = useRef(new Set<number>())
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const retryTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const retries = useRef<Record<number, number>>({})
  const locked = useRef(false)
  const running = useRef(new Map<number, Promise<void>>())
  const failedNow = useRef<number[]>([])
  const waitingNow = useRef(0)

  // The answers are taken in the same render the Attempt arrives in (resume after a refresh).
  const [source, setSource] = useState<AttemptItem[] | null>(null)
  const [resumed, setResumed] = useState<Resume | null>(null)
  if (items && items !== source) {
    const next = resume(attemptId, items)
    setSource(items)
    setResumed(next)
    setAnswers(next.answers)
  }

  const persist = useCallback(() => {
    writeStored(attemptId, device.current)
    waitingNow.current = Object.values(device.current).filter((entry) => entry.waiting).length
    setWaitingCount(waitingNow.current)
  }, [attemptId])

  const markFailed = (position: number, failedToo: boolean) => {
    failedNow.current = failedToo
      ? (failedNow.current.includes(position) ? failedNow.current : [...failedNow.current, position])
      : failedNow.current.filter((p) => p !== position)
    setFailed(failedNow.current)
  }

  const send = useCallback(function send(position: number): Promise<void> {
    if (locked.current) return Promise.resolve()
    if (inFlight.current.has(position)) {
      waiting.current.add(position)
      return running.current.get(position) ?? Promise.resolve()
    }
    clearTimeout(retryTimers.current[position])
    const local = latest.current[position]
    const version = (versions.current[position] ?? 0) + 1
    versions.current[position] = version
    inFlight.current.add(position)
    setBusy(inFlight.current.size)
    const promise = (async () => {
      try {
        const result = await saveAnswer(attemptId, position, { answer: local.value, marked_for_review: local.marked, version })
        versions.current[position] = Math.max(version, result.answer.version)
        retries.current[position] = 0
        // Still the newest change on this device: it is safe on the server now.
        if (latest.current[position] === local && !waiting.current.has(position)) {
          device.current = { ...device.current, [position]: { ...local, version: versions.current[position], waiting: false } }
          persist()
        }
        markFailed(position, false)
        if (failedNow.current.length === 0) setNetwork(false)
        setSavedAt(Date.now())
      } catch (error) {
        if (error instanceof ApiError && (error.code === 'time_up' || error.code === 'attempt_submitted')) {
          locked.current = true
          setClosed(true)
        } else {
          markFailed(position, true)
          if (error instanceof ApiError && error.status === 0) {
            setNetwork(true)
            const attempt = retries.current[position] ?? 0
            retries.current[position] = attempt + 1
            retryTimers.current[position] = setTimeout(() => void send(position), Math.min(1000 * 2 ** attempt, RETRY_MAX_MS))
          }
        }
      } finally {
        inFlight.current.delete(position)
        running.current.delete(position)
        setBusy(inFlight.current.size)
        if (waiting.current.delete(position)) void send(position)
      }
    })()
    running.current.set(position, promise)
    return promise
  }, [attemptId, persist])

  // After a resume: refs from the merged answers, and the device's waiting answers sent at once.
  useEffect(() => {
    if (!resumed) return
    latest.current = resumed.answers
    versions.current = { ...resumed.versions }
    device.current = resumed.device
    persist()
    resumed.resend.forEach((position) => void send(position))
  }, [resumed, persist, send])

  useEffect(() => {
    const online = () => failedNow.current.forEach((position) => void send(position))
    const offline = () => setNetwork(true)
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (waitingNow.current === 0) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [send])

  useEffect(() => () => {
    Object.values(timers.current).forEach(clearTimeout)
    Object.values(retryTimers.current).forEach(clearTimeout)
  }, [])

  /** Waits until nothing is on its way; returns the items whose answer is not saved. */
  const settle = useCallback(async () => {
    while (running.current.size > 0) await Promise.all([...running.current.values()])
    return failedNow.current
  }, [])

  /** Before submitting or at 0: sends the typed answers still waiting, then settles. */
  const flushAll = useCallback(async () => {
    for (const key of Object.keys(timers.current)) {
      const position = Number(key)
      clearTimeout(timers.current[position])
      delete timers.current[position]
      void send(position)
    }
    return settle()
  }, [send, settle])

  /** Sends again every answer that failed, then settles. */
  const retryAll = useCallback(async () => {
    failedNow.current.forEach((position) => void send(position))
    return settle()
  }, [send, settle])

  const change = useCallback((position: number, next: Partial<LocalAnswer>, typed = false) => {
    if (locked.current) return
    const updated = { ...latest.current[position], ...next }
    latest.current = { ...latest.current, [position]: updated }
    setAnswers(latest.current)
    device.current = { ...device.current, [position]: { ...updated, version: (versions.current[position] ?? 0) + 1, waiting: true } }
    persist()
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
  }, [send, persist])

  /** Sends a typed answer now instead of after the pause (leaving the item). */
  const flush = useCallback((position: number) => {
    if (timers.current[position] === undefined) return
    clearTimeout(timers.current[position])
    delete timers.current[position]
    void send(position)
  }, [send])

  const retry = useCallback(() => failed.forEach((position) => void send(position)), [failed, send])

  /** The Attempt has ended: the device copy is no longer needed. */
  const clearDevice = useCallback(() => {
    device.current = {}
    clearStored(attemptId)
    waitingNow.current = 0
    setWaitingCount(0)
  }, [attemptId])

  const offline = network && waitingCount > 0
  const state: SaveState = busy > 0 ? 'saving' : failed.length > 0 ? 'failed' : savedAt ? 'saved' : 'idle'
  return { answers, change, flush, flushAll, retry, retryAll, clearDevice, state, savedAt, failed, closed, offline, waitingCount }
}
