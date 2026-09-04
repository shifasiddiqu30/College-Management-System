import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  // Fetch current user if token exists
  useEffect(() => {
    async function verifyAuth() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (response.ok && data.success) {
          setUser(data.user);
        } else {
          // Token invalid or expired
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Auth verification error:', err);
      } finally {
        setLoading(false);
      }
    }

    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed.');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      showToast(`Welcome, ${data.user.name}!`, 'success');
      return data;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    showToast('Logged out successfully.', 'info');
  };

  // Helper auth fetch wrapper with session expiration handling
  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    };

    try {
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        showToast('Your session has expired. Please login again.', 'error');
      }
      return res;
    } catch (err) {
      throw err;
    }
  }, [token, showToast]);


  const value = {
    user,
    token,
    loading,
    login,
    logout,
    authFetch,
    showToast,
    isAdmin: user?.role === 'ADMIN',
    isFaculty: user?.role === 'FACULTY',
    isStudent: user?.role === 'STUDENT'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
