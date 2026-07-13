import { useState } from 'react';

/**
 * Reusable tag-style skill input.
 * Enter a skill name and press Enter or comma to add it.
 */
export default function SkillTagInput({ label, skills, onAdd, onRemove, type, placeholder }) {
  const [input, setInput] = useState('');

  const handleKey = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      onAdd(input.trim(), type);
      setInput('');
    }
  };

  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 10px',
        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
        background: 'var(--color-surface-raised)', minHeight: 42,
      }}>
        {skills.map((s, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: type === 'OFFER' ? 'var(--color-give-bg)' : 'var(--color-want-bg)',
            color: type === 'OFFER' ? 'var(--color-give)' : 'var(--color-want)',
            padding: '2px 8px', borderRadius: 999, fontSize: '0.82rem', fontWeight: 600,
          }}>
            {s}
            <button onClick={() => onRemove(i, type)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: 'inherit', fontSize: '1rem', lineHeight: 1,
            }} aria-label="Remove">×</button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={skills.length === 0 ? (placeholder || 'Type and press Enter…') : ''}
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            flexGrow: 1, minWidth: 100, fontSize: '0.92rem', color: 'var(--color-ink)',
          }}
        />
      </div>
      <p className="muted" style={{ fontSize: '0.78rem', marginTop: 3 }}>
        Press Enter after each skill to add it.
      </p>
    </div>
  );
}
