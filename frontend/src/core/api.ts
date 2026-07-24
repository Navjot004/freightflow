import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const trimLeadingSlash = (value: string) => value.replace(/^\/+/, '');
const isAbsoluteHttpUrl = (value: string) => /^https?:\/\//i.test(value);

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || "/api/v1"
);

console.log("VITE_API_BASE_URL =", import.meta.env.VITE_API_BASE_URL);
console.log("API_BASE_URL =", API_BASE_URL);

const apiOrigin = (() => {
  if (!isAbsoluteHttpUrl(API_BASE_URL)) return '';

  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return '';
  }
})();

export const toApiUrl = (path: string) => {
  if (!path) return '';
  if (isAbsoluteHttpUrl(path) || path.startsWith('data:')) return path;
  
  if (path.startsWith('/api/') || path.startsWith('api/')) {
    const cleanApiPath = path.startsWith('/') ? path : `/${path}`;
    if (apiOrigin) return `${apiOrigin}${cleanApiPath}`;
    return cleanApiPath;
  }

  const cleanPath = trimLeadingSlash(path);
  return `${API_BASE_URL}/${cleanPath}`;
};

export const toWebSocketUrl = (path: string) => {
  const configuredBaseUrl = import.meta.env.VITE_WS_BASE_URL;
  const baseUrl = configuredBaseUrl
    ? trimTrailingSlash(configuredBaseUrl)
    : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

  return `${baseUrl}/${trimLeadingSlash(path)}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/signup');
    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
