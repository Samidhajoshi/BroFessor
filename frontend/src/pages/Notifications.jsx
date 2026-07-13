import { useEffect, useState } from 'react';
import { notificationService } from '../api/notificationService';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await notificationService.getAll();
      setItems(data);
      setLoading(false);

      // Mark everything read as soon as the page opens —
      // the bell badge will clear on the next poll (≤15s).
      if (data.some(n => !n.isRead)) {
        notificationService.markAllRead().catch(() => {});
      }
    };
    load();
  }, []);

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>Activity on your requests, sessions, and ratings.</p>
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <h3>You're all caught up</h3>
          <p>New activity will show up here.</p>
        </div>
      ) : (
        <div className="card-list">
          {items.map((n) => (
            <div key={n.id} className="card">
              <p style={{ margin: 0 }}>{n.message}</p>
              <p className="muted" style={{ fontSize: '0.78rem', margin: '6px 0 0' }}>
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
