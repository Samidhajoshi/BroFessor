export default function TypingIndicator({ name }) {
  if (!name) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px' }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--color-ink-soft)',
            animation: `typingBounce 1.2s ${i * 0.2}s ease-in-out infinite`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-soft)' }}>
        {name} is typing…
      </span>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
