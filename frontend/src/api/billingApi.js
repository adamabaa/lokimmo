import axiosInstance  from './axiosInstance'
import axios          from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/lokimmo/backend/public'

const superAxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})
superAxiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('lk_super_token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

export const billingApi = {
  // Agence
  getCurrentPlan: ()   => axiosInstance.get('/api/billing/plan'),
  getInvoices:    ()   => axiosInstance.get('/api/billing/invoices'),

  // Super Admin
  getPlans:         ()          => superAxiosInstance.get('/api/super/billing/plans'),
  getAllInvoices:   (params)    => superAxiosInstance.get('/api/super/billing/invoices', { params }),
  createInvoice:    (data)      => superAxiosInstance.post('/api/super/billing/invoices', data),
  markInvoicePaid:  (id, data)  => superAxiosInstance.put(`/api/super/billing/invoices/${id}/pay`, data),
  getBillingStats:  ()          => superAxiosInstance.get('/api/super/billing/stats'),
}