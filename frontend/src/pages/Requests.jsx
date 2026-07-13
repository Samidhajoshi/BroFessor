import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestService } from '../api/requestService';
import { sessionService } from '../api/sessionService';

export default function Requests() {
  const { user } = useAuth();
  const [tab, setTab] = useState('incoming');
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptTarget, setAcceptTarget] = useState(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const loadAll = async () => {
    setLoading(true);
    const [inc, snt] = await Promise.all([requestService.incoming(), requestService.sent()]);
    setIncoming(inc);
    setSent(snt);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const openAccept = (req) => {
    setAcceptTarget(req);
    setScheduledTime('');
    setMeetingLink('');
    setError('');
  };

  const confirmAccept = async () => {
    if (!scheduledTime) {
      setError('Pick a date and time for the session.');
      return;
    }
    if (new Date(scheduledTime) <= new Date()) {
      setError('Please choose a future date and time.');
      return;
    }
    if (!meetingLink.trim()) {
      setError('Meeting link is required.');
      return;
    }
    if (!sessionService.isValidMeetingLink(meetingLink)) {
      setError(
        'Invalid meeting link. Supported: Google Meet (https://meet.google.com/xxx-xxxx-xxx), ' +
        'Zoom (https://zoom.us/j/...), Teams (https://teams.microsoft.com/...), ' +
        'Jitsi (https://meet.jit.si/Room).'
      );
      return;
    }
    setBusyId(acceptTarget.id);
    try {
      await requestService.accept(acceptTarget.id, { scheduledTime, meetingLink: meetingLink.trim() });
      setAcceptTarget(null);
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not accept this request.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id) => {
    setBusyId(id);
    try {
      await requestService.reject(id);
      await loadAll();
    } finally {
      setBusyId(null);
    }
  };

  const list = tab === 'incoming' ? incoming : sent;

  // Minimum datetime: now + 5 minutes
  const minDatetime = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Requests</h1>
          <p>Skill exchange requests you've sent and received.</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'incoming' ? ' active' : ''}`} onClick={() => setTab('incoming')}>
          Incoming ({incoming.filter((r) => r.status === 'PENDING').length})
        </button>
        <button className={`tab${tab === 'sent' ? ' active' : ''}`} onClick={() => setTab('sent')}>
          Sent ({sent.length})
        </button>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <h3>Nothing here yet</h3>
          <p>{tab === 'incoming' ? 'No one has requested a session with you yet.' : "You haven't sent any requests yet."}</p>
        </div>
      ) : (
        <div className="card-list">
          {list.map((req) => (
            <div className="card" key={req.id}>
              <div className="card-row">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h3 style={{ marginBottom: 0 }}>
                      {tab === 'incoming' ? req.senderName : req.receiverName}
                    </h3>
                    <Link
                      to={`/users/${tab === 'incoming' ? req.senderId : req.receiverId}`}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', padding: '2px 10px' }}
                    >
                      View profile
                    </Link>
                  </div>
                  <div className="exchange" style={{ marginBottom: 8 }}>
                    <span className="pill pill-want">Wants: {req.skillWanted}</span>
                    {req.skillOffered && (
                      <>
                        <span className="exchange-arrow">⇌</span>
                        <span className="pill pill-give">Offers: {req.skillOffered}</span>
                      </>
                    )}
                  </div>
                  {req.comment && <p className="muted" style={{ fontSize: '0.85rem' }}>“{req.comment}”</p>}
                  <span className="status" style={{ marginRight: 6 }}>
                    {req.oneWay ? 'One-way (25 pts)' : 'Barter'}
                  </span>
                  <span className={`status status-${req.status}`}>{req.status}</span>
                </div>
                {tab === 'incoming' && req.status === 'PENDING' && (
                  <div className="card-row" style={{ gap: 8 }}>
                    <button
                      className="btn btn-danger-outline btn-sm"
                      disabled={busyId === req.id}
                      onClick={() => handleReject(req.id)}
                    >
                      Reject
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={busyId === req.id}
                      onClick={() => openAccept(req)}
                    >
                      Accept
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {acceptTarget && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(28,35,33,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50,
          }}
        >
          <div className="card" style={{ maxWidth: 420, width: '100%' }}>
            <h3>Schedule with {acceptTarget.senderName}</h3>
            {error && <div className="error-banner">{error}</div>}
            <div className="field">
              <label htmlFor="scheduledTime">Date &amp; time</label>
              <input
                id="scheduledTime"
                type="datetime-local"
                min={minDatetime}
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="meetingLink">Meeting link</label>
              <input
                id="meetingLink"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij"
                style={{
                  borderColor: meetingLink && !sessionService.isValidMeetingLink(meetingLink)
                    ? 'var(--color-error, #e53e3e)' : undefined,
                }}
              />
              {meetingLink.trim() && (
                <p style={{
                  margin: '4px 0 0', fontSize: '0.78rem',
                  color: sessionService.isValidMeetingLink(meetingLink) ? '#22c55e' : 'var(--color-error, #e53e3e)',
                }}>
                  {sessionService.isValidMeetingLink(meetingLink) ? '✓ Valid link' : '✗ Unsupported or invalid link'}
                </p>
              )}
              <p className="muted" style={{ fontSize: '0.75rem', marginTop: 6 }}>
                Supported: Google Meet · Zoom · Microsoft Teams · Jitsi (https only)
              </p>
            </div>
            <div className="card-row">
              <button className="btn btn-outline" onClick={() => setAcceptTarget(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={busyId === acceptTarget.id || !sessionService.isValidMeetingLink(meetingLink) || !scheduledTime}
                onClick={confirmAccept}
              >
                {busyId === acceptTarget.id ? 'Scheduling…' : 'Confirm session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
