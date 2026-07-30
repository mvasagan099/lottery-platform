/**
 * Auth Store - Zustand
 * Manages authentication state, user info, and tokens
 *
 * MED-01 Security hardening:
 * - Access token is stored in Zustand memory ONLY (never localStorage / sessionStorage)
 *   so it cannot be stolen by XSS via localStorage.read()
 * - Refresh token is managed as an HttpOnly cookie set by the server.
 *   The frontend never sees or stores the refresh token.
 * - The persisted store only retains non-sensitive user metadata (id, email, role)
 *   and the isAuthenticated flag so the UI can restore its state across page reloads.
 *   A proper token refresh is always required to obtain a new access token after reload.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthStore {
  user: User | null
  /** Access token kept in memory ONLY — never written to localStorage */
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  setAuth: (user: User, accessToken: string) => void
  updateUser: (updates: Partial<User>) => void
  setToken: (accessToken: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      // MED-01: No localStorage writes for tokens — access token stays in Zustand memory,
      // refresh token is handled server-side via HttpOnly cookie.
      setAuth: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true })
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setToken: (accessToken) => {
        set({ accessToken })
      },

      logout: () => {
        // No localStorage cleanup needed — tokens were never stored there
        set({ user: null, accessToken: null, isAuthenticated: false })
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-store',
      // MED-01: Only persist non-sensitive user metadata.
      // accessToken is intentionally excluded — it must be refreshed after page reload.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
