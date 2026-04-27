import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Profile } from '../types'

export function useAuth() {
  const { profile, isLoading, setProfile, setLoading, clear } = useAuthStore()

  useEffect(() => {
    let mounted = true

    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (!mounted) return
        if (error || !data) { clear(); return }
        setProfile(data as Profile)
        setLoading(false)
      } catch {
        if (mounted) { clear(); setLoading(false) }
      }
    }

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { if (mounted) { clear(); setLoading(false) } return }
    
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        // If account is deactivated, force sign out
        if (data && !data.is_active) {
          await supabase.auth.signOut()
          if (mounted) { clear(); setLoading(false) }
          return
        }

        if (mounted) { setProfile(data as Profile); setLoading(false) }
      } catch { if (mounted) { clear(); setLoading(false) } }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'SIGNED_OUT' || !session) { clear(); return }
        if (event === 'SIGNED_IN' && session) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single()

            // Force sign out if deactivated
          if (data && !data.is_active) {
            await supabase.auth.signOut()
            clear()
            return
          }

          setProfile(data as Profile)
          setLoading(false)
        }
      }
    )
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    clear()
  }

  return {
    profile,
    isLoading,
    isAdmin: profile?.role === 'admin',
    isWorker: profile?.role === 'worker',
    signOut,
  }
}