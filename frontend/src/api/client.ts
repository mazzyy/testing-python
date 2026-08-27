import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Store token in memory as backup - initialize from localStorage if available
let memoryToken: string | null = localStorage.getItem('token');

export const setToken = (token: string | null) => {
  memoryToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getToken = (): string | null => {
  if (memoryToken) return memoryToken;
  return localStorage.getItem('token');
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect to login if we're already on a public page
      const publicPaths = ['/', '/login', '/register', '/programs', '/universities', '/scholarships'];
      const currentPath = window.location.pathname;
      const isPublicPage = publicPaths.some(path =>
        path === '/' ? currentPath === '/' : currentPath.startsWith(path)
      );
      if (!isPublicPage) {
        setToken(null);
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
