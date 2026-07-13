import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SkillTagInput from '../components/SkillTagInput';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', age: '', bio: '', userType: 'LEARNER',
  });
  const [skillsWanted,  setSkillsWanted]  = useState([]);
  const [skillsOffered, setSkillsOffered] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = (name, type) => {
    if (type === 'WANT')  setSkillsWanted(prev => [...prev, name]);
    if (type === 'OFFER') setSkillsOffered(prev => [...prev, name]);
  };

  const handleRemove = (index, type) => {
    if (type === 'WANT')  setSkillsWanted(prev => prev.filter((_, i) => i !== index));
    if (type === 'OFFER') setSkillsOffered(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (skillsWanted.length === 0)  { setError('Add at least one skill you want to learn.'); return; }
    if (form.userType === 'BARTER_USER' && skillsOffered.length === 0) {
      setError('Barter users must add at least one skill they can teach.'); return;
    }
    setLoading(true);
    try {
      await register({ ...form, age: Number(form.age) || 0, skillsWanted, skillsOffered });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create your account.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 520, position: 'relative' }}>
        {/* Close / back button */}
        <button
          onClick={() => navigate('/')}
          aria-label="Go back to home"
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-ink-soft)', fontSize: '1.4rem', lineHeight: 1,
            padding: '2px 6px', borderRadius: 6,
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.background = 'var(--color-border)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-ink-soft)'; e.currentTarget.style.background = 'none'; }}
        >
          ✕
        </button>

        <div className="brand" style={{ marginBottom: 18 }}>
          <span className="mark">Bro</span><span className="mark2">fessor</span>
        </div>
        <h1>Create account</h1>
        <p className="muted" style={{ marginBottom: 24 }}>Trade what you know for what you want to learn.</p>
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>How do you want to participate?</label>
            <div className="radio-group">
              {[['LEARNER','Learner','Start with 100 pts. Spend 25 pts per lesson.'],
                ['BARTER_USER','Barter user','Trade skill-for-skill. No points required.']].map(([val, title, desc]) => (
                <div key={val}
                  className={`radio-option${form.userType === val ? ' selected' : ''}`}
                  onClick={() => setForm(f => ({ ...f, userType: val }))}>
                  <strong>{title}</strong><span>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="age">Age</label>
              <input id="age" type="number" min="0" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" minLength={6} required value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>

          <div className="field">
            <label htmlFor="bio">Short bio (optional)</label>
            <textarea id="bio" rows={2} maxLength={500} value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Tell others about yourself…" />
          </div>

          <SkillTagInput
            label="Skills you want to learn"
            skills={skillsWanted}
            onAdd={handleAdd}
            onRemove={handleRemove}
            type="WANT"
            placeholder="e.g. Guitar, Python, Spanish…"
          />

          {form.userType === 'BARTER_USER' && (
            <SkillTagInput
              label="Skills you can teach"
              skills={skillsOffered}
              onAdd={handleAdd}
              onRemove={handleRemove}
              type="OFFER"
              placeholder="e.g. Excel, Yoga, Drawing…"
            />
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}
