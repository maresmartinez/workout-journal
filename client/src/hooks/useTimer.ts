import { useState, useEffect, useRef } from 'react'

export function useTimer(startedAt: string | undefined) {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)

  useEffect(() => {
    if (!startedAt) return

    const start = new Date(startedAt).getTime()

    function update() {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }

    update()
    intervalRef.current = setInterval(update, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [startedAt])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  return {
    display: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    elapsedSeconds: elapsed,
  }
}
