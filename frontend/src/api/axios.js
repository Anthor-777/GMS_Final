import axios from 'axios';

const TOKEN_KEY = 'gms_token';
const USER_KEY = 'gms_username';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let memoryToken = localStorage.getItem(TOKEN_KEY);

export function getToken() {
  return memoryToken || localStorage.getItem(TOKEN_KEY);
}

export function getStoredUsername() {
  return localStorage.getItem(USER_KEY) || '';
}

export function setSession(token, username) {
  memoryToken = token || null;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
  if (username) {
    localStorage.setItem(USER_KEY, username);
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function clearSession() {
  memoryToken = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = String(error.config?.url || '');
    const isLogin = url.includes('/auth/login');
    if (status === 401 && !isLogin) {
      clearSession();
      window.dispatchEvent(new Event('gms:unauthorized'));
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export function errorMessage(err) {
  return err?.response?.data?.message || err?.message || 'Request failed';
}

export function fieldErrors(err) {
  const list = err?.response?.data?.errors;
  if (!Array.isArray(list)) return {};
  return list.reduce((acc, item) => {
    if (item.field) acc[item.field] = item.message;
    return acc;
  }, {});
}

export async function fetchOptions(path) {
  const { data } = await api.get(path, { params: { limit: 1000, page: 1 } });
  return data.data || [];
}

export default api;
