import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const INITIAL_FORM = { username: '', password: '' };

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading, authError, clearAuthError } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate(from, { replace: true });
    }
  }, [from, isAuthenticated, loading, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    clearAuthError();

    if (!form.username.trim() || !form.password.trim()) {
      setError('Enter both username and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login({ username: form.username.trim(), password: form.password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const visibleError = error || authError;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.2),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] text-white">
      <div className="min-h-screen grid lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden lg:flex flex-col justify-between px-12 py-10 border-r border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.2),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.18),transparent_28%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 text-xs tracking-[0.2em] uppercase text-slate-300">
              Smart View
            </div>
            <h1 className="mt-8 text-5xl font-semibold tracking-tight max-w-xl">
              Inventory and sales control, without the clutter.
            </h1>
            <p className="mt-5 max-w-lg text-slate-300 text-base leading-7">
              Secure access for daily operations. Sign in to manage products, record sales, and keep the dashboard current.
            </p>
          </div>

          <div className="relative grid grid-cols-3 gap-4 max-w-xl">
            {[
              ['Protected', 'Session-based entry gate'],
              ['Fast', 'Persistent token-backed access'],
              ['Focused', 'Only the tools your team needs'],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-2 text-xs leading-5 text-slate-300">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Smart View</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in to continue</h1>
              <p className="mt-2 text-sm text-slate-300">
                Secure access to dashboard, products, and sales.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-2xl shadow-cyan-950/30 p-7 sm:p-8">
              <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">Welcome back</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Sign in</h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-400/15 border border-cyan-300/20 flex items-center justify-center text-cyan-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
                  </svg>
                </div>
              </div>

              {visibleError && (
                <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {visibleError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2" htmlFor="username">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your username"
                    value={form.username}
                    onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-400/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-400/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-400 px-4 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Signing in...' : 'Sign in securely'}
                </button>
              </form>

              <p className="mt-6 text-xs leading-5 text-slate-400">
                Auth token and user profile are preserved locally for the current session.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}