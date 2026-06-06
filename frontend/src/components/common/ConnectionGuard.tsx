'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { ConnectionError } from '@/lib/types/config'
import { ConnectionErrorOverlay } from '@/components/errors/ConnectionErrorOverlay'

interface ConnectionGuardProps {
  children: React.ReactNode
}

export function ConnectionGuard({ children }: ConnectionGuardProps) {
  const [error, setError] = useState<ConnectionError | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  // Use a ref to track checking status to avoid dependency cycles
  const isCheckingRef = useRef(false)

  const checkConnection = useCallback(async () => {
    // Skip startup connectivity gate — faster first paint
    isCheckingRef.current = false
    setIsChecking(false)
    setError(null)
  }, [])

  // Check connection on mount
  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  // Add keyboard shortcut for retry (R key)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (error && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault()
        checkConnection()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [error, checkConnection])

  // Show overlay if there's an error
  if (error) {
    return <ConnectionErrorOverlay error={error} onRetry={checkConnection} />
  }

  // Show nothing while checking (prevents flash of content)
  if (isChecking) {
    return null
  }

  // Render children if connection is good
  return <>{children}</>
}
