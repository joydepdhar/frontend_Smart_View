import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearAuthToken, setAuthToken, setUnauthorizedHandler } from '../api';

const AUTH_USER_STORAGE_KEY = 'smart_view_auth_user';

const AuthContext = createContext(null);

const readStoredUser = () => {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const persistUser = (user) => {
  if (typeof window === 'undefined') return;

  if (user) {
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }
};

const clearSession = () => {
  clearAuthToken();
  persistUser(null);
};

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('smart_view_auth_token');
  });
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(Boolean(token));
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      setTokenState(null);
      setUser(null);
      setLoading(false);
      setAuthError('Your session expired. Please sign in again.');
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let active = true;

    const syncProfile = async () => {
      if (!token || !api.me) {
        setLoading(false);
        return;
      }

      try {
        const profile = await api.me();
        if (!active || !profile) return;

        const nextUser = api.extractUser(profile) || profile;
        setUser(nextUser);
        persistUser(nextUser);
        setAuthError('');
      } catch (error) {
        if (!active) return;
        clearSession();
        setTokenState(null);
        setUser(null);
        setAuthError(error.message || 'Unable to validate your session.');
      } finally {
        if (active) setLoading(false);
      }
    };

    syncProfile();

    return () => {
      active = false;
    };
  }, [token]);

  const login = async (credentials) => {
    setAuthError('');
    const response = await api.login(credentials);
    const nextToken = api.extractToken(response);

    if (!nextToken) {
      throw new Error('Login response did not include a token.');
    }

    const nextUser = api.extractUser(response);
    persistUser(nextUser);
    setUser(nextUser);
    setTokenState(nextToken);
    setAuthError('');

    return response;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout failures and clear the local session either way.
    } finally {
      clearSession();
      setTokenState(null);
      setUser(null);
      setLoading(false);
      setAuthError('');
    }
  };

  const value = useMemo(() => ({
    user,
    token,
    loading,
    authError,
    isAuthenticated: Boolean(token),
    login,
    logout,
    clearAuthError: () => setAuthError(''),
  }), [user, token, loading, authError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};