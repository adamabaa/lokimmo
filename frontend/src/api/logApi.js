import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/lokimmo/backend/public'

const superAxios = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

superAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('lk_super_token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

export const logApi = {
  getLogs:     (params = {}) => superAxios.get('/api/super/logs',              { params }),
  getStats:    ()             => superAxios.get('/api/super/logs/stats'),
  getByAgency: (id, params)   => superAxios.get(`/api/super/logs/agency/${id}`, { params }),
}