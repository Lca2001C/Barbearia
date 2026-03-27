import axios from 'axios'
import { clearTokens } from './auth'

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const requestUrl = String(originalRequest?.url || '')
    const isAuthRoute = requestUrl.includes('/auth/')
    const shouldSkipRefresh = isAuthRoute || originalRequest?._skipRefresh

    if (error.response?.status === 401 && !originalRequest?._retry && !shouldSkipRefresh) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        processQueue(null, 'ok')
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearTokens()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
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
