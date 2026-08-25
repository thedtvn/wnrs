import { useEffect, useState } from 'react'

export function useCountdown(deadline: number | null, clockOffset: number): number {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!deadline) return
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [deadline])
  if (!deadline) return 0
  return Math.max(0, Math.ceil((deadline - now + clockOffset) / 1000))
}
