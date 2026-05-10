import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/lokimmo/backend/public'

// Instance Axios dédiée Super Admin
const superAxios = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Injecter le token super admin automatiquement
superAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('lk_super_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Rediriger vers /super/login si token expiré
superAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('lk_super_token')
      localStorage.removeItem('lk_super_admin')
      window.location.href = '/super/login'
    }
    return Promise.reject(error)
  }
)

export const superAdminApi = {
  login:          (data)     => superAxios.post('/api/super/login', data),
  me:             ()         => superAxios.get('/api/super/me'),
  stats:          ()         => superAxios.get('/api/super/stats'),
  getAgencies:    ()         => superAxios.get('/api/super/agencies'),
  getAgency:      (id)       => superAxios.get(`/api/super/agencies/${id}`),
  createAgency:   (data)     => superAxios.post('/api/super/agencies', data),
  updateAgency:   (id, data) => superAxios.put(`/api/super/agencies/${id}`, data),
  deleteAgency:   (id)       => superAxios.delete(`/api/super/agencies/${id}`),
  toggleAgency:   (id)       => superAxios.put(`/api/super/agencies/${id}/toggle`),
  resetPassword:  (id, data) => superAxios.put(`/api/super/agencies/${id}/reset-password`, data),
  changePlan:     (id, data) => superAxios.put(`/api/super/agencies/${id}/plan`, data),
}