import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDanger = true,
  onConfirm,
  onClose,
  loading = false
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f43f5e'
            }}>
              <AlertTriangle size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem' }}>{title}</h3>
          </div>
          <button className="btn-icon" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem 1.5rem' }}>
          <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
            style={{ minWidth: '90px' }}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
