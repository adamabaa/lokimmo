import axiosInstance from './axiosInstance'

export const onlinePaymentApi = {
  initiate: (data) => axiosInstance.post('/api/online-payments/initiate', data),
  verify:   (data) => axiosInstance.post('/api/online-payments/verify',   data),
  getAll:   ()     => axiosInstance.get('/api/online-payments'),
}