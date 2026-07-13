import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sessionService } from '../api/sessionService';
import { requestService } from '../api/requestService';
import SessionCard from '../components/sessions/SessionCard';
import SessionScheduler from '../components/sessions/SessionScheduler';
import SessionDetails from '../components/sessions/SessionDetails';

export default function Sessions() {
  const { user }   = useAuth();
  const [sessions, setSessions]     = useState([]);
  const [requests, setRequests]     = useState([]);   // accepted requests without a session
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [tab, setTab]               = useState('upcoming'); // 'upcoming' | 'past'

  // Modals
  const [scheduling, setScheduling]     = useState(null);  // acceptedRequest
  const [viewSession, setViewSession]   = useState(null);  // sessionDTO
  const [editing, setEditing]           = useState(null);  // sessionDTO
  const [rateTarget, setRateTarget]     = useState(null);  // sessionDTO
  const [rating, setRating]             = useState(80);
  const [review, setReview]             = useState('');
  const [editLink, setEditLink]         = useState('');
  const [editTime, setEditTime]         = useState('');
  const [busy, setBusy]                 = useState(false);

  // Minimum datetime for scheduling = now + 5 minutes
  const minDatetime = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

  // ── Data loading ──────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const [sessData, incomingData, sentData] = await Promise.all([
        sessionService.mySessions(),
        requestService.incoming(),
        requestService.sent(),
      ]);
      console.log("Sessions from backend:", sessData);
      setSessions(sessData);

      // Accepted requests that don't yet have a scheduled session
      const sessionReqIds = new Set(sessData.map(s => s.sessionRequestId).filter(Boolean));
      const accepted = [...incomingData, ...sentData].filter(
        r => r.status === 'ACCEPTED' && !sessionReqIds.has(r.id)
      );
      setRequests(accepted);
    } catch {
      setError('Failed to load sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Filters ───────────────────────────────────────────────────────────
  const upcoming = sessions.filter(s => s.status === 'SCHEDULED' || s.status === 'ONGOING');
  const past     = sessions.filter(s => s.status === 'COMPLETED' || s.status === 'CANCELLED');

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleComplete = async (id) => {
    setBusy(true);
    try {
      await sessionService.complete(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete session.');
    } finally { setBusy(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this session?')) return;
    setBusy(true);
    try {
      await sessionService.cancel(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel session.');
    } finally { setBusy(false); }
  };

  const handleRate = (s) => {
    setRateTarget(s);
    setRating(80);
    setReview('');
    setError('');
  };

  const submitRating = async () => {
    setBusy(true);
    try {
      await sessionService.rate(rateTarget.id, Number(rating), review.trim() || null);
      setRateTarget(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit rating.');
    } finally { setBusy(false); }
  };

  const handleEdit = (s) => {
    setEditing(s);
    setEditLink(s.meetingLink || '');
    setEditTime(s.scheduledTime ? s.scheduledTime.slice(0, 16) : '');
    setError('');
  };

  const submitEdit = async () => {
    // Bug fix #2: prevent past date in edit modal
    if (editTime && new Date(editTime) <= new Date()) {
      setError('Please choose a future date and time.');
      return;
    }
    setBusy(true);
    try {
      await sessionService.update(editing.id, {
        scheduledTime: editTime ? editTime + ':00' : undefined,
        meetingLink: editLink || undefined,
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update session.');
    } finally { setBusy(false); }
  };

  const handleScheduled = async () => {
    setScheduling(null);
    await load();
  };

  // ── Render helpers ───────────────────────────────────────────────────
  const counterpartName = (r) =>
    r.senderId === user?.id ? r.receiverName : r.senderName;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Sessions</h1>
          <p>Manage your skill-exchange sessions.</p>
        </div>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div>}

      {/* Accepted requests ready to schedule */}
      {requests.length > 0 && (
        <div className="card" style={{ marginBottom: 24, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <h4 style={{ marginTop: 0, marginBottom: 10, color: '#166534' }}>
            📅 {requests.length} accepted request{requests.length > 1 ? 's' : ''} ready to schedule
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {requests.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: '0.9rem' }}>
                  <strong>{r.skillWanted}</strong> with {counterpartName(r)}
                </span>
                <button className="btn btn-primary btn-sm" onClick={() => setScheduling(r)}>
                  Schedule Session
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid #e5e7eb' }}>
        {[['upcoming', `Upcoming (${upcoming.length})`], ['past', `Past (${past.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '8px 20px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: tab === key ? 700 : 400,
            color: tab === key ? 'var(--color-brand, #16a34a)' : '#6b7280',
            borderBottom: tab === key ? '2px solid var(--color-brand, #16a34a)' : '2px solid transparent',
            marginBottom: -2,
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Session list */}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : (tab === 'upcoming' ? upcoming : past).length === 0 ? (
        <div className="empty-state">
          <h3>No {tab} sessions</h3>
          <p>{tab === 'upcoming'
            ? 'Accept a request and schedule a session to get started.'
            : 'Completed or cancelled sessions will appear here.'}</p>
        </div>
      ) : (
        <div>
          {(tab === 'upcoming' ? upcoming : past).map(s => (
            <SessionCard
              key={s.id}
              session={s}
              currentUserId={user?.id}
              onComplete={handleComplete}
              onCancel={handleCancel}
              onRate={handleRate}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* ── Schedule modal ── */}
      {scheduling && (
        <SessionScheduler
          acceptedRequest={{
            id: scheduling.id,
            skillWanted: scheduling.skillWanted,
            senderName: scheduling.senderName,
            receiverName: scheduling.receiverName,
          }}
          onSuccess={handleScheduled}
          onClose={() => setScheduling(null)}
        />
      )}

      {/* ── Edit modal ── */}
      {editing && (
        <div role="dialog" aria-modal="true" style={{
          position: 'fixed', inset: 0, background: 'rgba(28,35,33,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 100,
        }}>
          <div className="card" style={{ maxWidth: 420, width: '100%' }}>
            <h3 style={{ marginBottom: 16 }}>Edit Session</h3>
            {error && <div className="error-banner" style={{ marginBottom: 10 }}>{error}</div>}
            <div className="field">
              <label>New Date &amp; Time</label>
              {/* Bug fix #2: min prevents selecting past dates */}
              <input type="datetime-local" value={editTime}
                min={minDatetime}
                onChange={e => setEditTime(e.target.value)} />
            </div>
            <div className="field" style={{ marginTop: 10 }}>
              <label>New Meeting Link</label>
              <input type="url" value={editLink}
                onChange={e => setEditLink(e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-outline" onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
              <button className="btn btn-primary" onClick={submitEdit} disabled={busy}>
                {busy ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rate modal ── */}
      {rateTarget && (
        <div role="dialog" aria-modal="true" style={{
          position: 'fixed', inset: 0, background: 'rgba(28,35,33,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 100,
        }}>
          <div className="card" style={{ maxWidth: 420, width: '100%' }}>
            <h3>Rate &amp; review {rateTarget.user1Id === user?.id ? rateTarget.user2Name : rateTarget.user1Name}</h3>
            <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 16 }}>
              Session: <strong>{rateTarget.skill}</strong>
            </p>
            {error && <div className="error-banner" style={{ marginBottom: 10 }}>{error}</div>}
            <div className="field">
              <label>Score: <strong>{rating}</strong> / 100</label>
              <input type="range" min={1} max={100} value={rating}
                onChange={e => setRating(e.target.value)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-ink-soft)' }}>
                <span>1 — Needs work</span><span>100 — Outstanding</span>
              </div>
            </div>
            <div className="field" style={{ marginTop: 8 }}>
              <label>Feedback (optional)</label>
              <textarea rows={3} maxLength={1000} value={review}
                onChange={e => setReview(e.target.value)}
                placeholder="Share your experience…" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
              <button className="btn btn-outline" onClick={() => setRateTarget(null)} disabled={busy}>Cancel</button>
              <button className="btn btn-primary" onClick={submitRating} disabled={busy}>
                {busy ? 'Submitting…' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Session detail modal ── */}
      {viewSession && (
        <SessionDetails
          session={viewSession}
          currentUserId={user?.id}
          onClose={() => setViewSession(null)}
        />
      )}
    </div>
  );
}
