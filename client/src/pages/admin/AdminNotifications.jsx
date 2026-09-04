import React, { useState, useEffect } from 'react';
import { Bell, Send, Megaphone, CheckCircle2, Users, Layers, ShieldCheck, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminNotifications() {
  const { user, authFetch, showToast } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('ALL');
  const [message, setMessage] = useState('');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      showToast('Please fill in title and announcement message.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await authFetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          target
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Circular broadcasted successfully to ${target}!`, 'success');
        setTitle('');
        setMessage('');
        fetchNotifications();
      } else {
        showToast(data.message || 'Failed to broadcast circular', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Server error while broadcasting', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await authFetch('/api/admin/notifications/mark-all-read', { method: 'PUT' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
        showToast('All notifications marked as read', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
      {/* Create Broadcast Box */}
      <div className="table-container" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8'
          }}>
            <Megaphone size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Publish Campus Circular</h3>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Send high-priority alerts to Students, Faculty, or All Users</p>
          </div>
        </div>

        <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Circular Headline *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Schedule for Academic Viva & Evaluation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Audience *</label>
            <select
              className="form-select"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="ALL">Entire Campus (All Roles)</option>
              <option value="STUDENT">Students Only</option>
              <option value="FACULTY">Faculty & Teaching Staff</option>
              <option value="ADMIN">Administrative Staff</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Announcement Content *</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="Type your circular details, guidelines, or instructions here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              style={{ resize: 'vertical' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={submitting}>
            <Send size={16} />
            <span>{submitting ? 'Broadcasting...' : 'Publish Broadcast'}</span>
          </button>
        </form>
      </div>

      {/* Broadcasts History */}
      <div className="table-container" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981'
            }}>
              <Bell size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Campus Broadcasts & Alerts</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>System notices & circular history</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {notifications.some(n => !n.isRead) && (
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={handleMarkAllRead}>
                <CheckCheck size={14} />
                <span>Mark All Read</span>
              </button>
            )}
            <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600 }}>{notifications.length} Total</span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            No circulars or system notifications recorded yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '440px', overflowY: 'auto' }}>
            {notifications.map((b) => (
              <div
                key={b.id}
                style={{
                  background: !b.isRead ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${!b.isRead ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-subtle)'}`,
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{b.title}</h4>
                  <span className="tag-pill" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontSize: '0.7rem' }}>
                    {b.targetRole || 'ALL'}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.4' }}>{b.message}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b', marginTop: '0.35rem' }}>
                  <span>Type: {b.type || 'SYSTEM'}</span>
                  <span>{b.createdAt ? new Date(b.createdAt).toLocaleString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

