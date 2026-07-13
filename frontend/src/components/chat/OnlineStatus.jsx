export default function OnlineStatus({ isOnline, showLabel = false }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
        background: isOnline ? '#2F8F5B' : '#aaa',
        boxShadow: isOnline ? '0 0 0 2px rgba(47,143,91,0.2)' : 'none',
      }} />
      {showLabel && (
        <span style={{ fontSize: '0.78rem', color: isOnline ? 'var(--color-success)' : 'var(--color-ink-soft)' }}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </span>
  );
}
