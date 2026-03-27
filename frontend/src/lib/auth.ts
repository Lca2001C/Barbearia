const USER_KEY = 'barbershop_user'

export function clearTokens(): void {
  localStorage.removeItem(USER_KEY)
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
