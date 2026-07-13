import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { chatService } from '../api/chatService';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadChat, setUnreadChat] = useState(0);

  useEffect(() => {
    if (!user) return;
    const poll = async () => {
      try {
        const rooms = await chatService.getRooms();
        const total = rooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0);
        setUnreadChat(total);
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const handleLogout = () => { logout(); navigate('/login'); };

  const links = [
    ['/dashboard', 'Dashboard'],
    ['/browse',    'Browse'],
    ['/requests',  'Requests'],
    ['/sessions',  'Sessions'],
    ['/calendar',  'Calendar'],
    ['/chat',      'Chat', unreadChat],
    ['/profile',   'Profile'],
    ['/profile-analyzer', 'AI Analyzer'],
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand">
          <span className="mark">Bro</span><span className="mark2">fessor</span>
        </div>
        <nav className="nav-links">
          {links.map(([to, label, badge]) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span style={{ position: 'relative' }}>
                {label}
                {badge > 0 && (
                  <span style={{
                    position: 'absolute', top: -8, right: -10,
                    background: 'var(--color-danger)', color: 'white',
                    fontSize: '0.6rem', fontWeight: 700, minWidth: 14, height: 14,
                    borderRadius: 999, display: 'inline-flex',
                    alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                  }}>{badge}</span>
                )}
              </span>
            </NavLink>
          ))}
        </nav>
        <div className="nav-right">
          <NotificationBell />
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>Log out</button>
        </div>
      </div>
    </header>
  );
}
