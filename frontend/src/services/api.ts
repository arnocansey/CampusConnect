import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const isPersisted = !!localStorage.getItem('refreshToken');
        const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
        
        if (refreshToken) {
          const { data } = await axios.post('/api/auth/refresh-token', {
            refreshToken,
          });

          const storage = isPersisted ? localStorage : sessionStorage;
          storage.setItem('accessToken', data.data.accessToken);
          storage.setItem('refreshToken', data.data.refreshToken);

          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
