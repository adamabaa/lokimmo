import axiosInstance from './axiosInstance'

export const tenantApi = {
  getAll:        ()         => axiosInstance.get('/api/tenants'),
  getById:       (id)       => axiosInstance.get(`/api/tenants/${id}`),
  create:        (data)     => axiosInstance.post('/api/tenants', data),
  update:        (id, data) => axiosInstance.put(`/api/tenants/${id}`, data),
  delete:        (id)       => axiosInstance.delete(`/api/tenants/${id}`),
  setupPortal:   (id, data) => axiosInstance.put(`/api/tenants/${id}/portal`, data),
  disablePortal: (id)       => axiosInstance.delete(`/api/tenants/${id}/portal`),
}