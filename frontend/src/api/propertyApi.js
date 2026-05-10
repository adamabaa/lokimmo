import axiosInstance from './axiosInstance'

export const propertyApi = {
  getAll:   ()       => axiosInstance.get('/api/properties'),
  getById:  (id)     => axiosInstance.get(`/api/properties/${id}`),
  create:   (data)   => axiosInstance.post('/api/properties', data),
  update:   (id, data) => axiosInstance.put(`/api/properties/${id}`, data),
  delete:   (id)     => axiosInstance.delete(`/api/properties/${id}`),
}