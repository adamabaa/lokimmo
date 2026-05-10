import axiosInstance from './axiosInstance'

export const expenseApi = {
  getAll:  (propertyId) => axiosInstance.get('/api/expenses', { params: { property_id: propertyId } }),
  create:  (data)       => axiosInstance.post('/api/expenses', data),
  update:  (id, data)   => axiosInstance.put(`/api/expenses/${id}`, data),
  delete:  (id)         => axiosInstance.delete(`/api/expenses/${id}`),
}