import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

const EMPTY_FORM = { name: '', price: '', stock_quantity: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState('');

  const showToast = (message, type = 'success') => setToast({ message, type });

  const load = useCallback(async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch {
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showToast('Product name is required', 'error');
    if (!form.price || Number(form.price) <= 0) return showToast('Enter a valid price', 'error');
    if (form.stock_quantity === '' || Number(form.stock_quantity) < 0) return showToast('Enter valid stock', 'error');

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        price: parseFloat(form.price),
        stock_quantity: parseInt(form.stock_quantity),
      };
      if (editId) {
        const updated = await api.updateProduct(editId, payload);
        setProducts(p => p.map(x => x.id === editId ? updated : x));
        showToast('Product updated');
        setEditId(null);
      } else {
        const created = await api.createProduct(payload);
        setProducts(p => [created, ...p]);
        showToast('Product added');
      }
      setForm(EMPTY_FORM);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (p) => {
    setEditId(p.id);
    setForm({ name: p.name, price: p.price, stock_quantity: p.stock_quantity });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => { setEditId(null); setForm(EMPTY_FORM); };

  const handleDelete = async () => {
    try {
      await api.deleteProduct(confirmDelete.id);
      setProducts(p => p.filter(x => x.id !== confirmDelete.id));
      showToast('Product deleted');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {confirmDelete && (
        <ConfirmModal
          message={`Delete "${confirmDelete.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Products</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your inventory items</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="font-semibold text-slate-700 mb-4">
          {editId ? '✏️ Edit Product' : '➕ Add New Product'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Product Name *</label>
            <input
              type="text"
              placeholder="e.g. Rice (1kg)"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Price (৳) *</label>
            <input
              type="number"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Stock Quantity *</label>
            <input
              type="number"
              placeholder="0"
              min="0"
              value={form.stock_quantity}
              onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
            />
          </div>
          <div className="sm:col-span-3 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {submitting ? 'Saving...' : editId ? 'Update Product' : 'Add Product'}
            </button>
            {editId && (
              <button type="button" onClick={cancelEdit}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          />
        </div>
        <span className="text-sm text-slate-400">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-sm text-slate-400">{search ? 'No results found' : 'No products yet — add your first one above'}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Price</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Added</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((p, i) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-700">{p.name}</td>
                      <td className="px-5 py-3.5 text-right text-slate-600">৳{Number(p.price).toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.stock_quantity === 0 ? 'bg-red-100 text-red-700'
                          : p.stock_quantity < 5 ? 'bg-orange-100 text-orange-700'
                          : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {p.stock_quantity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-400 text-xs">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => startEdit(p)}
                            className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors">
                            Edit
                          </button>
                          <button onClick={() => setConfirmDelete(p)}
                            className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filtered.map((p) => (
                <div key={p.id} className="px-4 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-slate-700 text-sm">{p.name}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      p.stock_quantity === 0 ? 'bg-red-100 text-red-700'
                      : p.stock_quantity < 5 ? 'bg-orange-100 text-orange-700'
                      : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {p.stock_quantity === 0 ? 'Out' : `${p.stock_quantity} units`}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">৳{Number(p.price).toFixed(2)}</p>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(p)}
                      className="flex-1 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                      Edit
                    </button>
                    <button onClick={() => setConfirmDelete(p)}
                      className="flex-1 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
