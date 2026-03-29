import axios from 'axios'
import { clearTokens, getAccessToken, getRefreshToken, setAuthTokens } from './auth'

const isProd = process.env.NODE_ENV === 'production'
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL
const defaultDevApiUrl = 'https://localhost:8446/api'

if (isProd && !configuredApiUrl) {
  throw new Error('NEXT_PUBLIC_API_URL não configurada para ambiente de produção.')
}

const api = axios.create({
  baseURL: configuredApiUrl || defaultDevApiUrl,
  withCredentials: true,
})

function isPublicAuthPath(url: string | undefined): boolean {
  if (!url) return false
  return (
    url === '/auth' ||
    url.startsWith('/auth/login') ||
    url.startsWith('/auth/forgot-password') ||
    url.startsWith('/auth/reset-password') ||
    url.startsWith('/auth/refresh')
  )
}

api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config
  if (isPublicAuthPath(config.url)) {
    return config
  }
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve(token || '')
    }
  })
  failedQueue = []
}

async function refreshSession(): Promise<void> {
  const base = api.defaults.baseURL ?? ''
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('Sem refresh token')
  }

  const { data } = await axios.post<{
    data: { accessToken: string; refreshToken: string }
  }>(`${base}/auth/refresh`, { refreshToken }, { withCredentials: true })

  const payload = data?.data
  if (!payload?.accessToken || !payload?.refreshToken) {
    throw new Error('Resposta de refresh inválida')
  }
  setAuthTokens(payload.accessToken, payload.refreshToken)
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const requestUrl = String(originalRequest?.url || '')
    const isAuthRoute = requestUrl.includes('/auth/')
    const shouldSkipRefresh = isAuthRoute || originalRequest?._skipRefresh

    if (error.response?.status === 401 && !originalRequest?._retry && !shouldSkipRefresh) {
      if (!getRefreshToken()) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await refreshSession()
        processQueue(null, 'ok')
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearTokens()
        if (typeof window !== 'undefined') {
          const path = window.location.pathname
          const onAuthPage =
            path === '/login' ||
            path === '/register' ||
            path.startsWith('/forgot-password') ||
            path.startsWith('/reset-password')
          if (!onAuthPage) {
            window.location.href = '/login'
          }
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
