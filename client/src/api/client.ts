import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.errors?.join(', ') || error.response?.data?.error || 'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

export default apiClient
