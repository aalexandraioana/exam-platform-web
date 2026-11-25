import { useEffect, useState } from 'react'

/**
 * Milliseconds left until `expiresAt` by the server's clock (D-004): `offset` is the server time
 * minus the device time, measured when the Attempt was loaded. Computed on every render and
 * re-rendered every second, so it is right again as soon as a sleeping phone or tab wakes up.
 */
export function useCountdown(expiresAt: string | null, offset: number): number {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!expiresAt) return
    const timer = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(timer)
  }, [expiresAt])
  // Read the clock while rendering on purpose: the countdown must be right on the first frame.
  // oxlint-disable-next-line react/purity
  return expiresAt ? Date.parse(expiresAt) - (Date.now() + offset) : Infinity
}
