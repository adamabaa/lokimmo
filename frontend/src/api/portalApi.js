import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/lokimmo/backend/public'

const portalAxios = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

portalAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('lk_tenant_token')
  const slug  = localStorage.getItem('lk_tenant_slug')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  if (slug)  config.headers['X-Agency-Slug'] = slug
  return config
})

portalAxios.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('lk_tenant_token')
      localStorage.removeItem('lk_tenant_slug')
      window.location.href = '/tenant/login'
    }
    return Promise.reject(err)
  }
)

export const portalApi = {
  login:    (data) => portalAxios.post('/api/portal/login', data),
  me:       ()     => portalAxios.get('/api/portal/me'),
  contract: ()     => portalAxios.get('/api/portal/contract'),
  payments: ()     => portalAxios.get('/api/portal/payments'),
  agency:   ()     => portalAxios.get('/api/portal/agency'),
}