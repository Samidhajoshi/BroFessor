import { PROVIDER_META } from '../../api/sessionService';

/**
 * Full-page style detail view of one session.
 * Props: session, currentUserId, onClose, onJoin
 */
export default function SessionDetails({ session: s, currentUserId, onClose }) {
  if (!s) return null;

  const isUser1      = s.user1Id === currentUserId;
  const counterpart  = isUser1 ? s.user2Name : s.user1Name;
  const providerMeta = s.meetingProvider ? PROVIDER_META[s.meetingProvider] : null;

  const handleJoin = () => {
    window.open(s.meetingLink, '_blank', 'noopener,noreferrer');
  };

  const sessionTime = s.scheduledTime ? new Date(s.scheduledTime) : null;
  const now = Date.now();
  const canJoin = s.status === 'SCHEDULED' && s.meetingLink && sessionTime &&
    (sessionTime.getTime() - now) <= 15 * 60 * 1000;

  return (
    <div role="dialog" aria-modal="true" style={{
      position: 'fixed', inset: 0,
      background: 'rgba(28,35,33,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, zIndex: 100,
    }}>
      <div className="card" style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>{s.skill} with {counterpart}</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.9rem' }}>
          <Row label="Status">
            <span style={{ fontWeight: 600 }}>{s.status}</span>
          </Row>
          <Row label="Type">
            {s.oneWay ? 'One-way learning' : 'Barter exchange'}
          </Row>
          {sessionTime && (
            <Row label="Scheduled">
              {sessionTime.toLocaleString(undefined, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </Row>
          )}
          {providerMeta && (
            <Row label="Provider">
              <span style={{ color: providerMeta.color, fontWeight: 600 }}>
                {providerMeta.emoji} {providerMeta.label}
              </span>
            </Row>
          )}
          {s.meetingLink && (
            <Row label="Meeting Link">
              <a href={s.meetingLink} target="_blank" rel="noreferrer"
                style={{ wordBreak: 'break-all', fontSize: '0.82rem' }}>
                {s.meetingLink}
              </a>
            </Row>
          )}
          {s.hostUserId === currentUserId && (
            <Row label="Role"><span style={{ color: '#6b7280' }}>Host</span></Row>
          )}
          {s.createdAt && (
            <Row label="Created">
              {new Date(s.createdAt).toLocaleString()}
            </Row>
          )}
        </div>

        {canJoin && (
          <button className="btn btn-primary" style={{ marginTop: 20, width: '100%' }} onClick={handleJoin}>
            🚀 Join Meeting
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <span className="muted" style={{ minWidth: 110, fontWeight: 500 }}>{label}:</span>
      <span>{children}</span>
    </div>
  );
}
