import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ product: '', quantity: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [preview, setPreview] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([api.getSales(), api.getProducts()]);
      setSales(s);
      setProducts(p);
    } catch {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Update preview total when product/qty changes
  useEffect(() => {
    if (form.product && form.quantity > 0) {
      const p = products.find(x => x.id === parseInt(form.product));
      if (p) {
        setPreview({
          price: p.price,
          total: (Number(p.price) * Number(form.quantity)).toFixed(2),
          stock: p.stock_quantity,
          name: p.name,
        });
      }
    } else {
      setPreview(null);
    }
  }, [form.product, form.quantity, products]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product) return showToast('Select a product', 'error');
    if (!form.quantity || form.quantity < 1) return showToast('Quantity must be at least 1', 'error');

    setSubmitting(true);
    try {
      const created = await api.createSale({
        product: parseInt(form.product),
        quantity: parseInt(form.quantity),
      });
      // Refresh both to get updated stock
      const [newSales, newProducts] = await Promise.all([api.getSales(), api.getProducts()]);
      setSales(newSales);
      setProducts(newProducts);
      showToast(`Sale recorded — ৳${Number(created.total_price).toFixed(2)}`);
      setForm({ product: '', quantity: '' });
      setPreview(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteSale(confirmDelete.id);
      setSales(s => s.filter(x => x.id !== confirmDelete.id));
      showToast('Sale record deleted');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  const selectedProduct = form.product ? products.find(p => p.id === parseInt(form.product)) : null;

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {confirmDelete && (
        <ConfirmModal
          message={`Delete sale of "${confirmDelete.product_name}"? Stock will NOT be restored.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Sales</h1>
        <p className="text-sm text-slate-500 mt-0.5">Record transactions and view history</p>
      </div>

      {/* Sale form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="font-semibold text-slate-700 mb-4">🛒 New Sale</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Select Product *</label>
              <select
                value={form.product}
                onChange={e => setForm(f => ({ ...f, product: e.target.value, quantity: '' }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
              >
                <option value="">-- Choose product --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id} disabled={p.stock_quantity === 0}>
                    {p.name} — ৳{Number(p.price).toFixed(2)} {p.stock_quantity === 0 ? '(Out of stock)' : `(${p.stock_quantity} in stock)`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Quantity *
                {selectedProduct && (
                  <span className="text-slate-400 font-normal ml-1">
                    (max {selectedProduct.stock_quantity})
                  </span>
                )}
              </label>
              <input
                type="number"
                placeholder="0"
                min="1"
                max={selectedProduct?.stock_quantity || undefined}
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                disabled={!form.product}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className={`rounded-lg border px-4 py-3 text-sm flex items-center justify-between ${
              preview.stock < Number(form.quantity)
                ? 'bg-red-50 border-red-200'
                : 'bg-indigo-50 border-indigo-200'
            }`}>
              <div>
                <span className="text-slate-600">Total: </span>
                <span className="font-bold text-slate-800 text-base">৳{preview.total}</span>
                <span className="text-slate-400 text-xs ml-2">
                  ({form.quantity} × ৳{Number(preview.price).toFixed(2)})
                </span>
              </div>
              {preview.stock < Number(form.quantity) && (
                <span className="text-red-600 text-xs font-medium">⚠ Exceeds stock ({preview.stock})</span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !form.product || !form.quantity}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {submitting ? 'Processing...' : 'Record Sale'}
          </button>
        </form>
      </div>

      {/* Sales history */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700 text-sm">Sales History</h2>
          <span className="text-xs text-slate-400">{sales.length} record{sales.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sales.length === 0 ? (
          <div className="py-14 text-center">
            <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm text-slate-400">No sales recorded yet</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Product</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit Price</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Qty</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date & Time</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sales.map((s, i) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-700">{s.product_name}</td>
                      <td className="px-5 py-3.5 text-right text-slate-500">৳{Number(s.product_price).toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-right text-slate-600">{s.quantity}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-800">৳{Number(s.total_price).toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-right text-slate-400 text-xs">
                        {new Date(s.created_at).toLocaleString('en-GB', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => setConfirmDelete(s)}
                          className="px-2 py-1 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors">
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y divide-slate-100">
              {sales.map((s) => (
                <div key={s.id} className="px-4 py-4 flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-700 text-sm">{s.product_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {s.quantity} × ৳{Number(s.product_price).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(s.created_at).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800 text-sm">৳{Number(s.total_price).toFixed(2)}</span>
                    <button onClick={() => setConfirmDelete(s)}
                      className="text-xs text-red-400 hover:text-red-600">✕</button>
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
