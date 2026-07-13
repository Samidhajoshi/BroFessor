import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PROVIDER_META } from '../../api/sessionService';

export default function SessionCard({ session: s, currentUserId, onComplete, onCancel, onRate, onEdit }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const isUser1       = s.user1Id === currentUserId;
  const counterpart   = isUser1 ? s.user2Name : s.user1Name;
  const counterpartId = isUser1 ? s.user2Id   : s.user1Id;
  const myRating      = isUser1 ? s.user1Rating : s.user2Rating;
  const isHost        = s.hostUserId === currentUserId;
  const providerMeta  = s.meetingProvider ? PROVIDER_META[s.meetingProvider] : null;

  const sessionMs = s.scheduledTime ? new Date(s.scheduledTime).getTime() : null;
  const diffMs    = sessionMs !== null ? sessionMs - now : null;

  // Join is only valid when:
  //   1. status is exactly SCHEDULED (never CANCELLED, COMPLETED, ONGOING)
  //   2. there is a meeting link
  //   3. within the window: 15 min before start up to 2 hours after start
  //      diffMs > 0 means future, diffMs < 0 means past
  //      A large negative diffMs (e.g. yesterday) must NOT satisfy <= 15 min
  const JOIN_BEFORE_MS = 15 * 60 * 1000;        // open 15 min before
  const JOIN_AFTER_MS  = 2 * 60 * 60 * 1000;    // close 2 h after start

  const canJoin =
    s.status === 'SCHEDULED' &&
    !!s.meetingLink &&
    diffMs !== null &&
    diffMs <= JOIN_BEFORE_MS &&      // at most 15 min in the future
    diffMs >= -JOIN_AFTER_MS;        // at most 2 h in the past — KEY FIX

  const handleJoin = () => window.open(s.meetingLink, '_blank', 'noopener,noreferrer');

  const formatCountdown = () => {
    if (diffMs === null || diffMs <= 0) return '🚀 Starting now!';
    const h   = Math.floor(diffMs / 3600000);
    const m   = Math.floor((diffMs % 3600000) / 60000);
    const sec = Math.floor((diffMs % 60000) / 1000);
    if (h > 0) return `Starts in ${h}h ${m}m`;
    if (m > 0) return `Starts in ${m}m ${sec}s`;
    return `Starts in ${sec}s`;
  };

  const statusColors = {
    SCHEDULED: { bg: '#e8f5e9', color: '#2e7d32' },
    ONGOING:   { bg: '#fff3e0', color: '#e65100' },
    COMPLETED: { bg: '#e3f2fd', color: '#1565c0' },
    CANCELLED: { bg: '#fce4ec', color: '#b71c1c' },
  };
  const sc = statusColors[s.status] || {};

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 style={{ margin: 0, marginBottom: 4 }}>
            {s.skill} with{' '}
            <Link
              to={`/users/${counterpartId}`}
              style={{ color: 'var(--color-give)', textDecoration: 'none', fontWeight: 700 }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              {counterpart}
            </Link>
          </h3>

          <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
            {s.scheduledTime
              ? new Date(s.scheduledTime).toLocaleString(undefined, {
                  weekday: 'short', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })
              : 'Time not set'}
          </p>

          {/* Countdown — only show when < 2h away and not yet started */}
          {s.status === 'SCHEDULED' && diffMs !== null && diffMs > 0 && diffMs < 2 * 3600000 && (
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#f59e0b', fontWeight: 600 }}>
              {formatCountdown()}
            </p>
          )}
          {s.status === 'SCHEDULED' && diffMs !== null && diffMs <= 0 && diffMs >= -JOIN_AFTER_MS && (
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#22c55e', fontWeight: 600 }}>
              🚀 Starting now!
            </p>
          )}
        </div>

        {/* Status badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            fontSize: '0.75rem', borderRadius: 99, padding: '2px 10px',
            background: sc.bg, color: sc.color, fontWeight: 600,
          }}>
            {s.status}
          </span>
          <span className="status" style={{ fontSize: '0.75rem' }}>
            {s.oneWay ? 'One-way' : 'Barter'}
          </span>
          {providerMeta && (
            <span style={{
              fontSize: '0.75rem', borderRadius: 99, padding: '2px 10px',
              background: providerMeta.color + '22', color: providerMeta.color, fontWeight: 600,
            }}>
              {providerMeta.emoji} {providerMeta.label}
            </span>
          )}
          {isHost && (
            <span style={{
              fontSize: '0.72rem', borderRadius: 99, padding: '2px 8px',
              background: '#f3f4f6', color: '#6b7280', fontWeight: 500,
            }}>
              host
            </span>
          )}
        </div>
      </div>

      {/* Meeting link — hide for CANCELLED */}
      {s.meetingLink && s.status !== 'CANCELLED' && (
        <p style={{ margin: '8px 0 0', fontSize: '0.8rem' }} className="muted">
          🔗 <a href={s.meetingLink} target="_blank" rel="noreferrer">
            {s.meetingLink.slice(0, 60)}{s.meetingLink.length > 60 ? '…' : ''}
          </a>
        </p>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>

        {/* View profile of counterpart */}
        <Link to={`/users/${counterpartId}`} className="btn btn-outline btn-sm" style={{ fontSize: '0.78rem' }}>
          View profile
        </Link>

        {/* Join — gated by canJoin which enforces the time window */}
        {canJoin && (
          <button className="btn btn-primary btn-sm" onClick={handleJoin}>
            🚀 Join Meeting
          </button>
        )}

        {/* Edit (host only, SCHEDULED only) */}
        {isHost && s.status === 'SCHEDULED' && onEdit && (
          <button className="btn btn-outline btn-sm" onClick={() => onEdit(s)}>
            Edit
          </button>
        )}

        {/* Mark Complete (SCHEDULED only) */}
        {s.status === 'SCHEDULED' && (
          <button className="btn btn-primary btn-sm" onClick={() => onComplete(s.id)}>
            Mark Complete
          </button>
        )}

        {/* Rate (COMPLETED, not yet rated) */}
        {s.status === 'COMPLETED' && myRating === 0 && (
          <button className="btn btn-outline btn-sm" onClick={() => onRate(s)}>
            Rate &amp; Review
          </button>
        )}
        {s.status === 'COMPLETED' && myRating > 0 && (
          <span className="muted" style={{ fontSize: '0.82rem' }}>Rated: {myRating}/100</span>
        )}

        {/* Cancel — SCHEDULED or ONGOING only, never CANCELLED or COMPLETED */}
        {(s.status === 'SCHEDULED' || s.status === 'ONGOING') && (
          <button
            className="btn btn-outline btn-sm"
            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
            onClick={() => onCancel(s.id)}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
