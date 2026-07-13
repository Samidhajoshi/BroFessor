import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not log in. Check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ position: 'relative' }}>
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
        <h1>Welcome back</h1>
        <p className="muted" style={{ marginBottom: 24 }}>Log in to trade a skill today.</p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p className="auth-switch">New to Brofessor? <Link to="/register">Create an account</Link></p>
      </div>
    </div>
  );
}
