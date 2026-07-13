import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../api/userService';
import UserCard from '../components/UserCard';

export default function Dashboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  const offered = (user.skills || []).filter(s => s.type === 'OFFER');
  const wanted  = (user.skills || []).filter(s => s.type === 'WANT');

  useEffect(() => {
    userService.getAll().then(data => {
      setLeaders(data.filter(u => u.id !== user.id).slice(0, 5));
      setLoading(false);
    });
  }, [user.id]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Welcome back, {user.name.split(' ')[0]} 👋</h1>
          <p>{user.userType === 'LEARNER' ? 'Learner account' : 'Barter user account'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {offered.map(s => <span key={s.id} className="pill pill-give">✦ {s.skillName}</span>)}
          {wanted.map(s  => <span key={s.id} className="pill pill-want">◈ {s.skillName}</span>)}
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="value">{user.points}</div>
          <div className="label">Points</div>
        </div>
        <div className="stat-card">
          <div className="value">{user.totalRatings > 0 ? user.averageRating?.toFixed(1) : '—'}</div>
          <div className="label">Avg. rating</div>
        </div>
        <div className="stat-card">
          <div className="value"><span className={`badge badge-${user.badge}`}>{user.badge}</span></div>
          <div className="label">Badge</div>
        </div>
        <div className="stat-card">
          <div className="value">{(user.skills || []).length}</div>
          <div className="label">Skills listed</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
        <Link to="/browse" className="btn btn-give">Find a skill to learn</Link>
        <Link to="/calendar" className="btn btn-outline">View calendar</Link>
        <Link to="/profile" className="btn btn-outline">Edit profile &amp; skills</Link>
      </div>

      <h2>Top-rated members</h2>
      {loading ? <p className="muted">Loading…</p> : leaders.length === 0 ? (
        <div className="empty-state">
          <h3>No ratings yet</h3>
          <p>Complete a session and leave a rating to appear here.</p>
        </div>
      ) : (
        <div className="card-list">
          {leaders.map(u => <UserCard key={u.id} user={u} />)}
        </div>
      )}
    </div>
  );
}
