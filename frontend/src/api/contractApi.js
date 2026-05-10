import axiosInstance from './axiosInstance'

export const contractApi = {
  getAll:   ()         => axiosInstance.get('/api/contracts'),
  getById:  (id)       => axiosInstance.get(`/api/contracts/${id}`),
  create:   (data)     => axiosInstance.post('/api/contracts', data),
  update:   (id, data) => axiosInstance.put(`/api/contracts/${id}`, data),
  delete:   (id)       => axiosInstance.delete(`/api/contracts/${id}`),
}