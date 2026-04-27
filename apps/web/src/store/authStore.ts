import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile } from '../types'

interface AuthState {
  profile: Profile | null
  isLoading: boolean
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profile: null,
      isLoading: true,
      setProfile: (profile) => set({ profile, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      clear: () => set({ profile: null, isLoading: false }),
    }),
    {
      name: 'bnm-auth',
      // Only persist profile, never persist loading state
      partialize: (state) => ({ profile: state.profile }),
      // Always start fresh with isLoading true
      onRehydrateStorage: () => (state) => {
        if (state) state.isLoading = true
      },
    }
  )
)