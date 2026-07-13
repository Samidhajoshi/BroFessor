import { useState } from 'react';
import { sessionService, PROVIDER_META } from '../../api/sessionService';

/**
 * Modal form to schedule a session for an accepted request.
 * Props:
 *   acceptedRequest – { id, skillWanted, senderName, receiverName }
 *   onSuccess(sessionDTO) – called after successful creation
 *   onClose()
 */
export default function SessionScheduler({ acceptedRequest, onSuccess, onClose }) {
  const [scheduledTime, setScheduledTime] = useState('');
  const [meetingLink, setMeetingLink]     = useState('');
  const [busy, setBusy]                   = useState(false);
  const [error, setError]                 = useState('');

  const provider     = sessionService.detectProvider(meetingLink);
  const providerMeta = provider ? PROVIDER_META[provider] : null;
  const linkValid    = sessionService.isValidMeetingLink(meetingLink);

  // Minimum datetime = now + 5 minutes
  const minDatetime = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString().slice(0, 16);

  const handleSubmit = async () => {
    setError('');
    if (!scheduledTime) { setError('Please pick a date and time.'); return; }
    if (!meetingLink.trim()) { setError('Meeting link is required.'); return; }
    if (!linkValid) {
      setError(
        'Invalid meeting link. Supported: Google Meet (https://meet.google.com/xxx-xxxx-xxx), ' +
        'Zoom (https://zoom.us/j/...), Teams (https://teams.microsoft.com/...), ' +
        'Jitsi (https://meet.jit.si/Room).'
      );
      return;
    }

    setBusy(true);
    try {
      const session = await sessionService.create({
        sessionRequestId: acceptedRequest.id,
        scheduledTime: scheduledTime + ':00', // add seconds
        meetingLink: meetingLink.trim(),
      });
      onSuccess(session);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not schedule the session. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" style={{
      position: 'fixed', inset: 0,
      background: 'rgba(28,35,33,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, zIndex: 100,
    }}>
      <div className="card" style={{ maxWidth: 480, width: '100%' }}>
        <h3 style={{ marginBottom: 4 }}>Schedule Session</h3>
        <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 20 }}>
          Skill: <strong>{acceptedRequest.skillWanted}</strong> ·{' '}
          {acceptedRequest.senderName} ↔ {acceptedRequest.receiverName}
        </p>

        {error && (
          <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div>
        )}

        {/* Date & Time */}
        <div className="field">
          <label htmlFor="sched-time">Date &amp; Time</label>
          <input
            id="sched-time"
            type="datetime-local"
            min={minDatetime}
            value={scheduledTime}
            onChange={e => setScheduledTime(e.target.value)}
          />
        </div>

        {/* Meeting Link */}
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="meeting-link">Meeting Link</label>
          <input
            id="meeting-link"
            type="url"
            value={meetingLink}
            onChange={e => setMeetingLink(e.target.value)}
            placeholder="https://meet.google.com/abc-defg-hij"
            style={{
              borderColor: meetingLink && !linkValid ? 'var(--color-error, #e53e3e)' : undefined,
            }}
          />

          {/* Provider badge */}
          {meetingLink.trim() && (
            <div style={{ marginTop: 6, fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              {linkValid && providerMeta ? (
                <>
                  <span style={{
                    background: providerMeta.color + '22',
                    color: providerMeta.color,
                    borderRadius: 99, padding: '2px 10px',
                    fontWeight: 600, fontSize: '0.8rem',
                  }}>
                    {providerMeta.emoji} {providerMeta.label}
                  </span>
                  <span style={{ color: '#22c55e' }}>✓ Valid link</span>
                </>
              ) : (
                <span style={{ color: 'var(--color-error, #e53e3e)' }}>
                  ✗ Unsupported or invalid link
                </span>
              )}
            </div>
          )}

          <p className="muted" style={{ fontSize: '0.75rem', marginTop: 6 }}>
            Supported: Google Meet · Zoom · Microsoft Teams · Jitsi (https only)
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-outline" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={busy || !linkValid || !scheduledTime}
          >
            {busy ? 'Scheduling…' : 'Confirm Session'}
          </button>
        </div>
      </div>
    </div>
  );
}
