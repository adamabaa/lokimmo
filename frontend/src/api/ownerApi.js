import axiosInstance from './axiosInstance'

export const ownerApi = {
  getAll:        ()         => axiosInstance.get('/api/owners'),
  getById:       (id)       => axiosInstance.get(`/api/owners/${id}`),
  create:        (data)     => axiosInstance.post('/api/owners', data),
  update:        (id, data) => axiosInstance.put(`/api/owners/${id}`, data),
  delete:        (id)       => axiosInstance.delete(`/api/owners/${id}`),
  setupPortal:   (id, data) => axiosInstance.put(`/api/owners/${id}/portal`, data),
  disablePortal: (id)       => axiosInstance.delete(`/api/owners/${id}/portal`),
}