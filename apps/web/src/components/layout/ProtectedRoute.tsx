import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { PageLoader } from '../ui/Spinner'

interface Props { role?: 'admin' | 'worker'; children: React.ReactNode }

export const ProtectedRoute = ({ role, children }: Props) => {
  const { profile, isLoading } = useAuth()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) setTimedOut(true)
    }, 10000) // 10 second max wait
    return () => clearTimeout(timer)
  }, [isLoading])

  // Still loading but not timed out
  if (isLoading && !timedOut) return <PageLoader />

  // Timed out or no profile — go to login
  if (!profile || timedOut) return <Navigate to="/login" replace />

  // Wrong role — redirect to correct portal
  if (role && profile.role !== role) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/worker'} replace />
  }

  return <>{children}</>
}