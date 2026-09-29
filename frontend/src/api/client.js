import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('pg_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response && err.response.status === 401 && localStorage.getItem('pg_token') && !err.config.url.includes('/auth/login')) {
      localStorage.removeItem('pg_token')
      localStorage.removeItem('pg_user')
      window.dispatchEvent(new Event('pg-logout'))
    }
    return Promise.reject(err)
  },
)

export const errorText = (err, fallback = 'Something went wrong. Please try again.') =>
  (err && err.response && err.response.data && (err.response.data.error || err.response.data.message)) ||
  (err && err.message === 'Network Error' ? 'Can’t reach the server. Is the backend running?' : fallback)

export default api