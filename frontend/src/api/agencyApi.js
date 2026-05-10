import axiosInstance from './axiosInstance'

export const agencyApi = {
  getProfile:    ()       => axiosInstance.get('/api/agency/profile'),
  updateProfile: (data)   => axiosInstance.put('/api/agency/profile', data),
  uploadLogo:    (file)   => {
    const formData = new FormData()
    formData.append('logo', file)
    return axiosInstance.post('/api/agency/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}