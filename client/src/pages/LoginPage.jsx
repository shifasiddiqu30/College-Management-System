import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck, Users2, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/common/ThemeToggle';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both College Email and Password.');
      return;
    }

    setLoading(true);
    try {
      const data = await login(email.trim(), password.trim());
      if (data.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'FACULTY') {
        navigate('/faculty/dashboard');
      } else if (data.user.role === 'STUDENT') {
        navigate('/student/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark
          ? 'radial-gradient(ellipse at center, #131d33 0%, #090d16 80%)'
          : 'radial-gradient(ellipse at center, #eef2ff 0%, #f1f5f9 80%)',
        padding: '1.5rem',
        color: isDark ? '#fff' : '#0f172a',
        position: 'relative',
        transition: 'background 0.3s ease, color 0.3s ease'
      }}
    >
      {/* Top Floating Theme Toggle */}
      <div
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 20
        }}
      >
        <ThemeToggle showLabel />
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: isDark ? 'rgba(15, 23, 42, 0.85)' : '#ffffff',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: isDark ? '0 25px 60px rgba(0,0,0,0.6)' : '0 20px 50px rgba(15, 23, 42, 0.08)',
          backdropFilter: 'blur(16px)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', textDecoration: 'none' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
              }}
            >
              <Sparkles size={24} color="#fff" />
            </div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: isDark ? '#fff' : '#0f172a', letterSpacing: '-0.02em' }}>
              AcademiaX
            </span>
          </Link>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: isDark ? '#fff' : '#0f172a' }}>
            Unified College Portal
          </h2>
          <p style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '0.25rem' }}>
            Enter your college credentials to sign in
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">College Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="name@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                autoComplete="email"
                required
              />
              <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                autoComplete="current-password"
                required
              />
              <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Campus'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Quick Fill Demo Chips */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              color: isDark ? '#94a3b8' : '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 700,
              marginBottom: '0.75rem',
              textAlign: 'center'
            }}
          >
            Quick-Fill Demo Credentials
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              className="tag-pill"
              onClick={() => fillCredentials('admin@college.edu', 'Admin@123')}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <ShieldCheck size={14} color="#6366f1" />
              <span>Admin (admin@college.edu)</span>
            </button>
            <button
              type="button"
              className="tag-pill"
              onClick={() => fillCredentials('sharma@college.edu', 'Faculty@123')}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Users2 size={14} color="#0891b2" />
              <span>Faculty (sharma@college.edu)</span>
            </button>
            <button
              type="button"
              className="tag-pill"
              onClick={() => fillCredentials('student@college.edu', 'Student@123')}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <GraduationCap size={14} color="#059669" />
              <span>Student (student@college.edu)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
