import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
console.log("API URL:", import.meta.env.VITE_API_URL);
const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT to every request once the user is logged in.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('skillify_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is rejected or expired, drop local auth state so the
// app falls back to the login screen instead of looping on 401s.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('skillify_token');
      localStorage.removeItem('skillify_user');
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
