import axiosInstance from './axiosInstance'

export const authApi = {
  register: (data) =>
    axiosInstance.post('/api/auth/register', data, {
      headers: { 'X-Agency-Slug': data.slug }
    }),

  login: (data) =>
    axiosInstance.post('/api/auth/login', data, {
      headers: { 'X-Agency-Slug': data.slug }
    }),

  me: () =>
    axiosInstance.get('/api/auth/me'),

  logout: () =>
    axiosInstance.post('/api/auth/logout'),
}