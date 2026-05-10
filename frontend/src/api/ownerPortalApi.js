import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/lokimmo/backend/public'

const ownerAxios = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

ownerAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('lk_owner_token')
  const slug  = localStorage.getItem('lk_owner_slug')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  if (slug)  config.headers['X-Agency-Slug'] = slug
  return config
})

ownerAxios.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('lk_owner_token')
      localStorage.removeItem('lk_owner_slug')
      window.location.href = '/owner/login'
    }
    return Promise.reject(err)
  }
)

export const ownerPortalApi = {
  login:             (data) => ownerAxios.post('/api/owner-portal/login', data),
  me:                ()     => ownerAxios.get('/api/owner-portal/me'),
  properties:        ()     => ownerAxios.get('/api/owner-portal/properties'),
  propertyPayments:  (id)   => ownerAxios.get(`/api/owner-portal/properties/${id}/payments`),
  propertyExpenses:  (id)   => ownerAxios.get(`/api/owner-portal/properties/${id}/expenses`),
  summary:           ()     => ownerAxios.get('/api/owner-portal/summary'),
  agency:            ()     => ownerAxios.get('/api/owner-portal/agency'),
}