import axiosInstance from './axiosInstance'

export const paymentApi = {
  getAll:   ()         => axiosInstance.get('/api/payments'),
  getById:  (id)       => axiosInstance.get(`/api/payments/${id}`),
  create:   (data)     => axiosInstance.post('/api/payments', data),
  update:   (id, data) => axiosInstance.put(`/api/payments/${id}`, data),
}