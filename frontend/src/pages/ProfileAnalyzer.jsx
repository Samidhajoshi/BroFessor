import { useState, useEffect } from 'react';
import { analyzeProfile, getLatestAnalysis } from '../api/profileAnalyzerService';

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const filled = (score / 100) * circ;
  const color = score >= 75 ? 'var(--color-give)' : score >= 50 ? 'var(--color-want)' : 'var(--color-danger)';
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Work';

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          strokeDashoffset="0"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text x="70" y="64" textAnchor="middle" fontSize="28" fontWeight="700" fill="var(--color-ink)" fontFamily="var(--font-display)">{score}</text>
        <text x="70" y="82" textAnchor="middle" fontSize="11" fill="var(--color-ink-soft)" fontFamily="var(--font-body)">/100</text>
      </svg>
      <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color }}>{label}</div>
    </div>
  );
}

function Chip({ text, color, bg }) {
  return (
    <span style={{
      display: 'inline-block', padding: '4px 12px', borderRadius: 99,
      fontSize: 13, fontWeight: 500, color, background: bg, marginRight: 6, marginBottom: 6
    }}>{text}</span>
  );
}

function Card({ title, children, accent }) {
  return (
    <div style={{
      background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-card)', padding: '20px 24px', marginBottom: 16,
      borderLeft: `4px solid ${accent || 'var(--color-border)'}`
    }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>{title}</h3>
      {children}
    </div>
  );
}

function SuggestionItem({ text, index }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
      <div style={{
        minWidth: 24, height: 24, borderRadius: '50%',
        background: 'var(--color-give-bg)', color: 'var(--color-give)',
        fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>{index + 1}</div>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--color-ink-soft)', lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}

function Skeleton() {
  const bar = (w, h = 14, mb = 10) => (
    <div style={{ width: w, height: h, borderRadius: 6, background: 'var(--color-border)', marginBottom: mb, animation: 'pulse 1.4s infinite' }} />
  );
  return (
    <>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-card)' }}>
            {bar('60%', 16, 14)}{bar('80%')}{bar('90%')}{bar('70%')}
          </div>
        ))}
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProfileAnalyzer() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getLatestAnalysis()
      .then(r => setAnalysis(r.data))
      .catch(() => { /* no prior analysis yet */ })
      .finally(() => setLoadingLatest(false));
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await analyzeProfile();
      setAnalysis(data);
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = !analysis ? 'var(--color-give)'
    : analysis.profileScore >= 75 ? 'var(--color-give)'
    : analysis.profileScore >= 50 ? 'var(--color-want)'
    : 'var(--color-danger)';

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>
            AI Profile Analyzer
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-ink-soft)' }}>
            Get personalized recommendations to improve your Brofessor profile
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{
            padding: '10px 22px', borderRadius: 'var(--radius-md)', border: 'none',
            background: loading ? 'var(--color-border)' : 'var(--color-give)',
            color: loading ? 'var(--color-ink-soft)' : '#fff',
            fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.2s'
          }}
        >
          {loading ? (
            <>
              <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Analyzing…
            </>
          ) : '✦ Analyze My Profile'}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: 20, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Initial loading skeleton */}
      {loadingLatest && <Skeleton />}

      {/* No analysis yet */}
      {!loadingLatest && !analysis && !loading && (
        <div style={{
          textAlign: 'center', padding: '60px 20px', background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
          <h2 style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontSize: 20 }}>No analysis yet</h2>
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 14, margin: 0 }}>
            Click <strong>Analyze My Profile</strong> above to get your personalized score and AI feedback.
          </p>
        </div>
      )}

      {/* Loading skeleton while AI runs */}
      {loading && <Skeleton />}

      {/* Results */}
      {analysis && !loading && (
        <>
          {analysis.cached && (
            <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginBottom: 12, textAlign: 'right' }}>
              ✓ Showing cached result — click Analyze to refresh
            </div>
          )}

          {/* Score + summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{
              background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)',
              padding: '24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <ScoreRing score={analysis.profileScore} />
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-ink-soft)' }}>Profile Score</div>
            </div>

            {/* AI Insights */}
            <div style={{
              background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)',
              padding: '20px 24px', borderLeft: '4px solid var(--color-give)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>✦</span>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)' }}>AI Insights</h3>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--color-give-bg)', color: 'var(--color-give)', fontWeight: 600 }}>Groq · Llama 3</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-ink-soft)', lineHeight: 1.65 }}>
                {analysis.aiFeedback}
              </p>
            </div>
          </div>

          {/* Strengths & Weaknesses row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 }}>
            <Card title="💪 Strengths" accent="var(--color-give)">
              {analysis.strengths.length === 0
                ? <p style={{ margin: 0, fontSize: 13, color: 'var(--color-ink-soft)' }}>Complete more profile sections to unlock strengths.</p>
                : analysis.strengths.map(s => (
                    <Chip key={s} text={s} color="var(--color-give)" bg="var(--color-give-bg)" />
                  ))
              }
            </Card>

            <Card title="⚠ Areas to Improve" accent="var(--color-want)">
              {analysis.weaknesses.length === 0
                ? <p style={{ margin: 0, fontSize: 13, color: 'var(--color-ink-soft)' }}>Great work — no major gaps found!</p>
                : analysis.weaknesses.map(w => (
                    <Chip key={w} text={w} color="var(--color-want)" bg="var(--color-want-bg)" />
                  ))
              }
            </Card>
          </div>

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <Card title="🎯 Improvement Suggestions" accent="var(--color-ink)">
              {analysis.suggestions.map((s, i) => <SuggestionItem key={i} text={s} index={i} />)}
            </Card>
          )}

          <p style={{ textAlign: 'right', fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 8 }}>
            Last analyzed: {new Date(analysis.createdAt).toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
}
