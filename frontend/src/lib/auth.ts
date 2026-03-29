const USER_KEY = 'barbershop_user'
const ACCESS_TOKEN_KEY = 'barbearia_bearer_access'
const REFRESH_TOKEN_KEY = 'barbearia_bearer_refresh'

export function clearTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setAuthTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: 'CLIENT' | 'ADMIN' | 'SUB_ADMIN'
  managedBarberId?: string | null
  avatarUrl?: string
}

export function isStaffRole(role: User['role']): boolean {
  return role === 'ADMIN' || role === 'SUB_ADMIN'
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}
