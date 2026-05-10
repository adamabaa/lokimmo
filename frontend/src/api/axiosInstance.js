import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL
  || 'http://localhost/lokimmo/backend/public'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15s max
})

// Retry automatique sur timeout
axiosInstance.interceptors.response.use(
  res => res,
  async err => {
    const config = err.config

    // Retry une fois si timeout ou 503
    if (
      !config._retry &&
      (err.code === 'ECONNABORTED' || err.response?.status === 503)
    ) {
      config._retry = true
      await new Promise(r => setTimeout(r, 1000)) // attendre 1s
      return axiosInstance(config)
    }

    if (err.response?.status === 401) {
      localStorage.removeItem('lk_token')
      localStorage.removeItem('lk_user')
      localStorage.removeItem('lk_slug')
      window.location.href = '/login'
    }

    return Promise.reject(err)
  }
)

axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('lk_token')
  const slug  = localStorage.getItem('lk_slug')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  if (slug)  config.headers['X-Agency-Slug'] = slug
  return config
})

export default axiosInstance