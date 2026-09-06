import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

type AuthResult = { error: string | null }

type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResult & { needsEmailConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<AuthResult>
  updatePassword: (password: string) => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function mapAuthError(message: string) {
  if (message.includes('Invalid login credentials')) return 'E-mail ou mot de passe incorrect.'
  if (message.includes('User already registered')) return 'Un compte existe déjà avec cet e-mail.'
  if (message.includes('Email not confirmed')) return 'Veuillez confirmer votre e-mail avant de vous connecter.'
  if (message.includes('Password should be at least')) return 'Le mot de passe est trop court.'
  if (message.toLowerCase().includes('fetch') || message.toLowerCase().includes('network')) {
    return 'Impossible de contacter le serveur. Vérifiez votre configuration Supabase.'
  }
  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return
        setSession(data.session)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    loading,
    async signUp(email, password, fullName) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) return { error: mapAuthError(error.message), needsEmailConfirmation: false }
      return { error: null, needsEmailConfirmation: !data.session }
    },
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: mapAuthError(error.message) }
      return { error: null }
    },
    async signOut() {
      await supabase.auth.signOut()
    },
    async requestPasswordReset(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) return { error: mapAuthError(error.message) }
      return { error: null }
    },
    async updatePassword(password) {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return { error: mapAuthError(error.message) }
      return { error: null }
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé à l’intérieur de AuthProvider')
  return ctx
}
