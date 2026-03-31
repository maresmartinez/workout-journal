import { useEffect, useCallback } from 'react'
import { useBlocker } from 'react-router-dom'

export function useNavigationGuard(shouldGuard: boolean) {
  const blocker = useBlocker(shouldGuard)

  useEffect(() => {
    if (!shouldGuard) return

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [shouldGuard])

  const discardAndProceed = useCallback(() => {
    if (blocker.proceed) {
      blocker.proceed()
    }
  }, [blocker])

  return {
    blocked: blocker.state === 'blocked',
    discardAndProceed,
    stay: blocker.reset,
  }
}
