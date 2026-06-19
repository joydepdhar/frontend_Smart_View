const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const AUTH_LOGIN_PATH = process.env.REACT_APP_AUTH_LOGIN_PATH || '/auth/login/';
const AUTH_LOGOUT_PATH = process.env.REACT_APP_AUTH_LOGOUT_PATH || '';
const AUTH_ME_PATH = process.env.REACT_APP_AUTH_ME_PATH || '/me/';
const AUTH_TOKEN_STORAGE_KEY = 'smart_view_auth_token';

let authToken = null;
let unauthorizedHandler = null;

const readStoredToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
};

authToken = readStoredToken();

const extractToken = (data) =>
  data?.access ||
  data?.token ||
  data?.key ||
  data?.auth_token ||
  data?.jwt ||
  null;

const extractUser = (data) => data?.user || data?.profile || data?.account || null;

const persistToken = (token) => {
  authToken = token || null;

  if (typeof window === 'undefined') return;

  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
};

const notifyUnauthorized = () => {
  if (typeof unauthorizedHandler === 'function') {
    unauthorizedHandler();
  }
};

const handleResponse = async (res) => {
  if (!res.ok) {
    if (res.status === 401) {
      notifyUnauthorized();
    }

    const err = await res.json().catch(() => ({ detail: 'An error occurred' }));
    const message =
      err.quantity?.[0] ||
      err.non_field_errors?.[0] ||
      err.detail ||
      Object.values(err).flat()[0] ||
      'Something went wrong';
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
};

const request = (path, options = {}) =>
  fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.auth === false || !authToken ? {} : { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
    ...options,
  }).then(handleResponse);

export const setAuthToken = (token) => {
  persistToken(token);
};

export const clearAuthToken = () => {
  persistToken(null);
};

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

export const authEndpoints = {
  login: AUTH_LOGIN_PATH,
  logout: AUTH_LOGOUT_PATH,
  me: AUTH_ME_PATH,
};

export const api = {
  login: (credentials) => request(AUTH_LOGIN_PATH, { method: 'POST', auth: false, body: JSON.stringify(credentials) }),
  logout: () => (AUTH_LOGOUT_PATH ? request(AUTH_LOGOUT_PATH, { method: 'POST' }) : Promise.resolve(null)),
  me: () => (AUTH_ME_PATH ? request(AUTH_ME_PATH) : Promise.resolve(null)),
  extractToken,
  extractUser,

  // Products
  getProducts: () => request('/products/'),
  getProduct: (id) => request(`/products/${id}/`),
  createProduct: (data) => request('/products/', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}/`, { method: 'DELETE' }),

  // Sales
  getSales: () => request('/sales/'),
  createSale: (data) => request('/sales/', { method: 'POST', body: JSON.stringify(data) }),
  deleteSale: (id) => request(`/sales/${id}/`, { method: 'DELETE' }),

  // Dashboard
  getDashboard: () => request('/dashboard/'),
};
