import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ showLabel = false, className = '', style = {} }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode (currently ${isDark ? 'Dark' : 'Light'} Mode)`}
      title={isDark ? 'Switch to Light Mode ☀️' : 'Switch to Dark Mode 🌙'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.45rem',
        height: '38px',
        minWidth: showLabel ? 'auto' : '38px',
        padding: showLabel ? '0 0.85rem' : '0',
        borderRadius: 'var(--radius-full)',
        background: 'var(--bg-header-btn)',
        border: '1px solid var(--border-subtle)',
        color: isDark ? '#fbbf24' : '#6366f1',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        position: 'relative',
        flexShrink: 0,
        ...style
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isDark ? 'rotate(0deg)' : 'rotate(360deg)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {isDark ? (
          <Moon size={18} strokeWidth={2.2} />
        ) : (
          <Sun size={18} strokeWidth={2.2} />
        )}
      </span>

      {showLabel && (
        <span
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap'
          }}
        >
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
