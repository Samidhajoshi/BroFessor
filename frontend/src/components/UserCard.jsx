import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';

export default function UserCard({ user, action }) {
  const offered = user.skills?.filter(s => s.type === 'OFFER') ?? [];
  const wanted  = user.skills?.filter(s => s.type === 'WANT')  ?? [];

  return (
    <div className="card">
      <div className="card-row">
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1 }}>

          {/* Clickable avatar */}
          <Link to={`/users/${user.id}`} style={{ flexShrink: 0, textDecoration: 'none' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--color-give-bg)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', overflow: 'hidden', fontSize: '1.3rem',
              transition: 'opacity 0.12s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {user.profilePhotoUrl
                ? <img src={API + user.profilePhotoUrl} alt={user.name}
                       style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : user.name?.[0]?.toUpperCase()}
            </div>
          </Link>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              {/* Clickable name */}
              <Link to={`/users/${user.id}`} style={{
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.05rem',
                color: 'var(--color-ink)', textDecoration: 'none',
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-give)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-ink)'}
              >
                {user.name}
              </Link>
              <span className={`badge badge-${user.badge}`}>{user.badge}</span>
            </div>

            {user.bio && (
              <p className="muted" style={{ fontSize: '0.83rem', marginBottom: 6 }}>
                {user.bio.length > 100 ? user.bio.slice(0, 100) + '…' : user.bio}
              </p>
            )}

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              {offered.map(s => <span key={s.id} className="pill pill-give">✦ {s.skillName}</span>)}
              {wanted.map(s  => <span key={s.id} className="pill pill-want">◈ {s.skillName}</span>)}
              {offered.length === 0 && wanted.length === 0 && (
                <span className="muted" style={{ fontSize: '0.82rem' }}>No skills listed yet</span>
              )}
            </div>

            <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
              {user.totalRatings > 0
                ? `${user.averageRating?.toFixed(1)} avg (${user.totalRatings} reviews)`
                : 'No reviews yet'}
              {' · '}{user.points} pts
            </p>
          </div>
        </div>

        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          {action}
          <Link to={`/users/${user.id}`} className="btn btn-outline btn-sm">
            View profile
          </Link>
        </div>
      </div>
    </div>
  );
}