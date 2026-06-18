const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const handleResponse = async (res) => {
  if (!res.ok) {
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
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  }).then(handleResponse);

export const api = {
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
