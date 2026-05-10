import axiosInstance from './axiosInstance'

export const scoreApi = {
  calculate:    (id) => axiosInstance.post(`/api/scores/calculate/${id}`),
  detail:       (id) => axiosInstance.get(`/api/scores/detail/${id}`),
  calculateAll: ()   => axiosInstance.post('/api/scores/calculate-all'),
}
