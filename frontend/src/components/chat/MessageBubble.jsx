import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';

const API = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function ReadTick({ status }) {
  if (status === 'READ')
    return <span style={{ color: '#34B7F1', fontSize: '0.7rem' }}>✓✓</span>;
  if (status === 'DELIVERED')
    return <span style={{ color: 'var(--color-ink-soft)', fontSize: '0.7rem' }}>✓✓</span>;
  return <span style={{ color: 'var(--color-ink-soft)', fontSize: '0.7rem' }}>✓</span>;
}

export default function MessageBubble({ message, isMine, showAvatar, showDate, prevDate }) {
  const dateLabel = formatDate(message.sentAt);
  const showDateDivider = showDate && dateLabel !== prevDate;

  return (
    <>
      {showDateDivider && (
        <div style={{ textAlign: 'center', margin: '16px 0 8px' }}>
          <span style={{
            fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ink-soft)',
            background: 'var(--color-bg)', padding: '3px 12px', borderRadius: 999,
          }}>
            {dateLabel}
          </span>
        </div>
      )}

      <div style={{
        display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end', gap: 8, marginBottom: 2,
      }}>
        {/* Avatar — other user only */}
        {!isMine && (
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'var(--color-want-bg)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '0.85rem', overflow: 'hidden',
            visibility: showAvatar ? 'visible' : 'hidden',
          }}>
            {message.senderPhoto
              ? <img src={resolvePhotoUrl(API, message.senderPhoto)} alt=""
                     style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : message.senderName?.[0]?.toUpperCase()}
          </div>
        )}

        {/* Bubble */}
        <div style={{ maxWidth: '70%' }}>
          <div style={{
            padding: '9px 13px',
            borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isMine ? 'var(--color-give)' : 'white',
            color: isMine ? 'white' : 'var(--color-ink)',
            border: isMine ? 'none' : '1px solid var(--color-border)',
            fontSize: '0.92rem', lineHeight: 1.45, wordBreak: 'break-word',
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
          }}>
            {message.content}
          </div>

          <div style={{
            display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start',
            alignItems: 'center', gap: 4, marginTop: 2, paddingLeft: isMine ? 0 : 4,
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-ink-soft)' }}>
              {formatTime(message.sentAt)}
            </span>
            {isMine && <ReadTick status={message.readStatus} />}
          </div>
        </div>
      </div>
    </>
  );
}
