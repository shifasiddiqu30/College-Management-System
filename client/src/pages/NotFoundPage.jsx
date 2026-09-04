import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#090d16',
      color: '#fff',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'rgba(244, 63, 94, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f43f5e',
        marginBottom: '1.5rem'
      }}>
        <AlertTriangle size={32} />
      </div>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>404 — Page Not Found</h1>
      <p style={{ color: '#94a3b8', maxWidth: '440px', margin: '0.75rem 0 2rem' }}>
        The page you are trying to access does not exist or requires different permission privileges.
      </p>
      <Link to="/" className="btn btn-primary">
        <Home size={18} />
        <span>Return to Home</span>
      </Link>
    </div>
  );
}
