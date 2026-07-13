import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationService } from '../api/notificationService';

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await notificationService.unreadCount();
        if (!cancelled) setUnread(data.unreadCount);
      } catch {
        // Auth may have lapsed; the axios interceptor already handles
        // clearing local state, so just skip this tick silently.
      }
    };

    poll();
    const interval = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <Link to="/notifications" className="nav-link" aria-label={`Notifications, ${unread} unread`}>
      <span className={unread > 0 ? 'notif-dot' : ''} data-count={unread > 0 ? unread : undefined}>
        🔔
      </span>
    </Link>
  );
}
