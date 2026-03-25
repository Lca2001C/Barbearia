'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import api from '@/lib/api'
import {
  setTokens,
  clearTokens,
  getAccessToken,
  setUser as storeUser,
  type User,
} from '@/lib/auth'
import toast from 'react-hot-toast'

interface AuthContextData {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!user

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get('/users/me')
      const userData = data.data
      setUser(userData)
      storeUser(userData)
    } catch {
      clearTokens()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      fetchUser().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [fetchUser])

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post('/auth/login', { email, password })
      const { user: userData, accessToken, refreshToken } = data.data
      setTokens(accessToken, refreshToken)
      setUser(userData)
      storeUser(userData)
      toast.success('Login realizado com sucesso!')
    },
    []
  )

  const register = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      const { data } = await api.post('/auth', { name, email, password, phone })
      const { user: userData, accessToken, refreshToken } = data.data
      setTokens(accessToken, refreshToken)
      setUser(userData)
      storeUser(userData)
      toast.success('Conta criada com sucesso!')
    },
    []
  )

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    toast.success('Logout realizado!')
    window.location.href = '/'
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
