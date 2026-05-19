import axios from 'axios'

const isProd = Boolean((import.meta as any).env.PROD)

const API_BASE_URL =
  (isProd
    ? (import.meta as any).env.VITE_API_URL_PROD
    : (import.meta as any).env.VITE_API_URL) ||
  (isProd
    ? 'https://gestaobandodehoras-production.up.railway.app/api'
    : 'http://localhost:5264/api')

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.error('Unauthorized access')
    }

    if (error.response?.status === 500) {
      // Handle server error
      console.error('Server error')
    }

    return Promise.reject(error)
  }
)

export default api
