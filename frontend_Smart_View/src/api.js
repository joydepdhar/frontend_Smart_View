const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const AUTH_LOGIN_PATH =
  process.env.REACT_APP_AUTH_LOGIN_PATH || '/login/';

const AUTH_ME_PATH =
  process.env.REACT_APP_AUTH_ME_PATH || '/me/';

const AUTH_REFRESH_PATH =
  process.env.REACT_APP_AUTH_REFRESH_PATH || '/token/refresh/';

const AUTH_TOKEN_STORAGE_KEY = 'smart_view_auth_token';
const AUTH_REFRESH_TOKEN_STORAGE_KEY = 'smart_view_refresh_token';

let authToken = null;
let refreshToken = null;
let unauthorizedHandler = null;

const readStoredToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
};

const readStoredRefreshToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY);
};

authToken = readStoredToken();
refreshToken = readStoredRefreshToken();

const extractToken = (data) => data?.access || null;

const extractRefreshToken = (data) => data?.refresh || null;

const extractUser = (data) =>
  data?.user ||
  data?.profile ||
  data?.account ||
  data;

const persistTokens = (access, refresh = null) => {
  authToken = access;
  if (refresh) refreshToken = refresh;

  if (typeof window === 'undefined') return;

  if (access) {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, access);
  } else {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }

  if (refresh) {
    localStorage.setItem(AUTH_REFRESH_TOKEN_STORAGE_KEY, refresh);
  }
};

const clearStoredTokens = () => {
  authToken = null;
  refreshToken = null;

  if (typeof window === 'undefined') return;

  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_STORAGE_KEY);
};

const notifyUnauthorized = () => {
  clearStoredTokens();

  if (typeof unauthorizedHandler === 'function') {
    unauthorizedHandler();
  }
};

const handleResponse = async (res) => {
  if (!res.ok) {
    if (res.status === 401) {
      notifyUnauthorized();
    }

    const err = await res
      .json()
      .catch(() => ({ detail: 'An error occurred' }));

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
      ...(options.auth === false || !authToken
        ? {}
        : {
            Authorization: `Bearer ${authToken}`,
          }),
      ...options.headers,
    },
    ...options,
  }).then(handleResponse);

export const setAuthToken = (token) => {
  authToken = token;

  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  }
};

export const setTokens = (access, refresh) => {
  persistTokens(access, refresh);
};

export const clearAuthToken = () => {
  clearStoredTokens();
};

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

export const authEndpoints = {
  login: AUTH_LOGIN_PATH,
  me: AUTH_ME_PATH,
  refresh: AUTH_REFRESH_PATH,
};

export const api = {
  // Authentication
  login: async (credentials) => {
    const data = await request(AUTH_LOGIN_PATH, {
      method: 'POST',
      auth: false,
      body: JSON.stringify(credentials),
    });

    if (data.access) {
      persistTokens(data.access, data.refresh);
    }

    return data;
  },

  refreshToken: () =>
    request(AUTH_REFRESH_PATH, {
      method: 'POST',
      auth: false,
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    }),

  me: () => request(AUTH_ME_PATH),

  extractToken,
  extractRefreshToken,
  extractUser,

  // Products
  getProducts: () => request('/products/'),
  getProduct: (id) => request(`/products/${id}/`),
  createProduct: (data) =>
    request('/products/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (id, data) =>
    request(`/products/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProduct: (id) =>
    request(`/products/${id}/`, {
      method: 'DELETE',
    }),

  // Sales
  getSales: () => request('/sales/'),
  createSale: (data) =>
    request('/sales/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteSale: (id) =>
    request(`/sales/${id}/`, {
      method: 'DELETE',
    }),

  // Dashboard
  getDashboard: () => request('/dashboard/'),

  // Admin Dashboard
  getAdminDashboard: () => request('/dashboard/admin/'),

  // Staff Dashboard
  getStaffDashboard: () => request('/dashboard/staff/'),

  // Staff Management
  getStaffUsers: () => request('/admin/staff/'),

  grantStaffAccess: (userId) =>
    request('/admin/staff/', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
      }),
    }),

  removeStaffAccess: (userId) =>
    request('/admin/staff/', {
      method: 'DELETE',
      body: JSON.stringify({
        user_id: userId,
      }),
    }),
};