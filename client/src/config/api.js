import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('firebaseToken');
    console.log('API Request to:', config.url);
    console.log('Token available:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set');
    } else {
      console.log('No token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('401 error - token might be expired');
      // Don't auto-redirect, let components handle it
      // localStorage.removeItem('firebaseToken');
      // localStorage.removeItem('user');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

