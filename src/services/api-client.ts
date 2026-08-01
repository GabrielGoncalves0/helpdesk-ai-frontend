import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically attach JWT token from cookies
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token') || Cookies.get('token');
  if (token && config.headers) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Interceptor to unwrap data and handle API errors cleanly
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('auth_token', { path: '/' });
      Cookies.remove('token', { path: '/' });
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'Erro na requisição';
    return Promise.reject(new Error(message));
  }
);

// Helper for multipart/form-data uploads
export const uploadApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

uploadApi.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token') || Cookies.get('token');
  if (token && config.headers) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

uploadApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('auth_token', { path: '/' });
      Cookies.remove('token', { path: '/' });
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'Erro no envio do arquivo';
    return Promise.reject(new Error(message));
  }
);

// Backward compatibility helpers
export async function apiFetch<T>(endpoint: string, options: any = {}): Promise<T> {
  const method = (options.method || 'GET').toLowerCase();
  const data = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined;
  const result = await api.request({
    url: endpoint,
    method,
    data,
  });
  return result as T;
}

export async function apiUploadFetch<T>(endpoint: string, formData: FormData): Promise<T> {
  const result = await uploadApi.post(endpoint, formData);
  return result as T;
}
