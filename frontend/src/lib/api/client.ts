import axios, { AxiosResponse } from 'axios'
import { getApiUrl } from '@/lib/config'

// API client with runtime-configurable base URL
// The base URL is fetched from the API config endpoint on first request
// Timeout increased to 10 minutes (600000ms = 600s) to accommodate slow LLM operations
// (transformations, insights generation, chat) especially on slower hardware (Ollama, LM Studio)
// Note: Frontend uses milliseconds, backend uses seconds
// Local LLMs can take several minutes for complex questions with large contexts
export const apiClient = axios.create({
  timeout: 600000, // 600 seconds = 10 minutes
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

// Request interceptor to add base URL and auth header
apiClient.interceptors.request.use(async (config) => {
  // Set the base URL dynamically from runtime config
  if (!config.baseURL) {
    const apiUrl = await getApiUrl()
    config.baseURL = `${apiUrl}/api`
  }

  if (typeof window !== 'undefined') {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const { state } = JSON.parse(authStorage)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
        console.log('[api] request auth token:', state.token)
      }
    }
  }

  // Handle FormData vs JSON content types
  if (config.data instanceof FormData) {
    // Remove any Content-Type header to let browser set multipart boundary
    delete config.headers['Content-Type']
  } else if (config.method && ['post', 'put', 'patch'].includes(config.method.toLowerCase())) {
    config.headers['Content-Type'] = 'application/json'
  }

  return config
})

// Response interceptor — pass errors through; callers handle 401
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => Promise.reject(error)
)

export default apiClient