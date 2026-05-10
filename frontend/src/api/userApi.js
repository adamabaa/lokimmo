import axiosInstance from './axiosInstance'

export const userApi = {
  getAll:        ()         => axiosInstance.get('/api/users'),
  create:        (data)     => axiosInstance.post('/api/users', data),
  update:        (id, data) => axiosInstance.put(`/api/users/${id}`, data),
  toggle:        (id)       => axiosInstance.put(`/api/users/${id}/toggle`),
  resetPassword: (id, data) => axiosInstance.put(`/api/users/${id}/reset-password`, data),
  delete:        (id)       => axiosInstance.delete(`/api/users/${id}`),
}