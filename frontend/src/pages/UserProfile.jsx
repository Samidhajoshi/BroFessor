import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../api/userService';
import { requestService } from '../api/requestService';
import { checkCompatibility, matchingSkills } from '../utils/compatibility';
import { resolvePhotoUrl } from '../utils/resolvePhotoUrl';

const API = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';

// ── Small helpers ──────────────────────────────────────────────────────────

function RatingBar({ value }) {
  const pct   = Math.round((value / 100) * 100);
  const color = value > 70 ? 'var(--color-success)' : value > 40 ? 'var(--color-want)' : 'var(--color-ink-soft)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--color-border)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: '0.82rem', fontWeight: 700, color, minWidth: 28 }}>{value}</span>
    </div>
  );
}

function SocialLink({ href, emoji, label }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 99,
      border: '1px solid var(--color-border)',
      fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-ink)',
      textDecoration: 'none', background: 'var(--color-bg)',
      transition: 'border-color 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-give)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
    >
      <span>{emoji}</span> {label}
    </a>
  );
}

function parseProjects(jsonStr) {
  try { return JSON.parse(jsonStr || '[]'); } catch { return []; }
}

function parsePlatforms(csv) {
  if (!csv) return [];
  return csv.split(',').map(s => s.trim()).filter(Boolean);
}

// ── Main component ─────────────────────────────────────────────────────────

export default function UserProfile() {
  const { id }       = useParams();
  const { user: me } = useAuth();
  const navigate     = useNavigate();

  const [profile,  setProfile]  = useState(null);
  const [reviews,  setReviews]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const [showRequest,  setShowRequest]  = useState(false);
  const [requestSkill, setRequestSkill] = useState('');
  const [comment,      setComment]      = useState('');
  const [sending,      setSending]      = useState(false);
  const [reqFeedback,  setReqFeedback]  = useState('');

  const [tab, setTab] = useState('about'); // 'about' | 'projects' | 'reviews'

  useEffect(() => {
    const uid = Number(id);
    if (!uid) { navigate('/browse'); return; }
    Promise.all([userService.getById(uid), userService.getReviews(uid)])
      .then(([u, r]) => { setProfile(u); setReviews(r); })
      .catch(() => setError('Could not load this profile.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><p className="muted">Loading…</p></div>;
  if (error)   return <div className="page"><div className="error-banner">{error}</div></div>;
  if (!profile) return null;

  const isOwnProfile = me?.id === profile.id;
  const compat       = isOwnProfile ? null : checkCompatibility(me, profile);
  const suggested    = compat?.compatible ? matchingSkills(me, profile) : [];

  const offered    = (profile.skills || []).filter(s => s.type === 'OFFER');
  const wanted     = (profile.skills || []).filter(s => s.type === 'WANT');
  const projects   = parseProjects(profile.projects);
  const platforms  = parsePlatforms(profile.learningPlatforms);

  const hasSocialLinks = profile.githubUrl || profile.linkedinUrl || profile.websiteUrl || platforms.length > 0;

  const openRequest = () => {
    setShowRequest(true); setReqFeedback(''); setComment('');
    setRequestSkill(suggested[0] || '');
  };

  const sendRequest = async () => {
    if (!requestSkill.trim()) { setReqFeedback('Enter the skill you want to learn.'); return; }
    setSending(true); setReqFeedback('');
    try {
      await requestService.send({ receiverId: profile.id, skillWanted: requestSkill.trim(), comment });
      setReqFeedback('success');
      setTimeout(() => setShowRequest(false), 1400);
    } catch (err) {
      setReqFeedback(err.response?.data?.message || 'Could not send the request.');
    } finally { setSending(false); }
  };

  const tabBtn = (key, label, count) => (
    <button onClick={() => setTab(key)} style={{
      padding: '8px 18px', background: 'none', border: 'none', cursor: 'pointer',
      fontWeight: tab === key ? 700 : 400,
      color: tab === key ? 'var(--color-brand, #16a34a)' : '#6b7280',
      borderBottom: tab === key ? '2px solid var(--color-brand, #16a34a)' : '2px solid transparent',
      marginBottom: -2, fontSize: '0.92rem',
    }}>
      {label}{count !== undefined ? ` (${count})` : ''}
    </button>
  );

  return (
    <div className="page" style={{ maxWidth: 740 }}>

      {/* ── Hero card ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Avatar */}
          <div style={{
            width: 90, height: 90, borderRadius: '50%', flexShrink: 0,
            background: 'var(--color-give-bg)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '2.2rem', overflow: 'hidden',
          }}>
            {profile.profilePhotoUrl
              ? <img src={resolvePhotoUrl(API, profile.profilePhotoUrl)} alt={profile.name}
                     style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : profile.name?.[0]?.toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            {/* Name + badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: '1.55rem' }}>{profile.name}</h1>
              <span className={`badge badge-${profile.badge}`}>{profile.badge}</span>
              <span className="pill pill-neutral">
                {profile.userType === 'BARTER_USER' ? 'Barter user' : 'Learner'}
              </span>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p style={{ color: 'var(--color-ink-soft)', marginBottom: 10, maxWidth: 480, lineHeight: 1.5 }}>
                {profile.bio}
              </p>
            )}

            {/* Stats */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  {profile.totalRatings > 0 ? profile.averageRating.toFixed(1) : '—'}
                </span>
                <span className="muted" style={{ fontSize: '0.8rem', marginLeft: 4 }}>
                  avg ({profile.totalRatings} {profile.totalRatings === 1 ? 'review' : 'reviews'})
                </span>
              </div>
              <div>
                <span style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  {profile.points}
                </span>
                <span className="muted" style={{ fontSize: '0.8rem', marginLeft: 4 }}>pts</span>
              </div>
              {profile.age > 0 && (
                <div>
                  <span style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                    {profile.age}
                  </span>
                  <span className="muted" style={{ fontSize: '0.8rem', marginLeft: 4 }}>yrs</span>
                </div>
              )}
            </div>

            {/* Social links row */}
            {hasSocialLinks && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                <SocialLink href={profile.githubUrl}   emoji="🐙" label="GitHub" />
                <SocialLink href={profile.linkedinUrl} emoji="💼" label="LinkedIn" />
                <SocialLink href={profile.websiteUrl}  emoji="🌐" label="Portfolio" />
                {platforms.map((url, i) => (
                  <SocialLink key={i} href={url} emoji="📚"
                    label={extractPlatformName(url)} />
                ))}
              </div>
            )}

            {/* Compatibility / request button */}
            {!isOwnProfile && (
              compat?.compatible ? (
                <div>
                  <button className="btn btn-give btn-sm" onClick={openRequest}>
                    Request a session
                  </button>
                  {suggested.length > 0 && (
                    <p className="muted" style={{ fontSize: '0.78rem', marginTop: 6 }}>
                      Matching skill{suggested.length > 1 ? 's' : ''}: <strong>{suggested.join(', ')}</strong>
                    </p>
                  )}
                </div>
              ) : (
                <div style={{
                  background: 'var(--color-want-bg)', border: '1px solid var(--color-want)',
                  borderRadius: 'var(--radius-md)', padding: '10px 14px', maxWidth: 420,
                }}>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-want)', fontWeight: 600 }}>
                    ⚠ Cannot send a request
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.83rem', color: 'var(--color-ink)' }}>
                    {compat?.reason}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)', marginBottom: 18 }}>
        {tabBtn('about',    'About')}
        {projects.length > 0 && tabBtn('projects', 'Projects', projects.length)}
        {tabBtn('reviews', 'Reviews', reviews.length)}
      </div>

      {/* ════════════ ABOUT tab ════════════ */}
      {tab === 'about' && (
        <>
          {/* Skills */}
          {(offered.length > 0 || wanted.length > 0) && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginBottom: 12 }}>Skills</h3>
              {offered.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p className="muted" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: 6,
                    textTransform: 'uppercase', letterSpacing: '0.05em' }}>Can teach</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {offered.map(s => <span key={s.id} className="pill pill-give">✦ {s.skillName}</span>)}
                  </div>
                </div>
              )}
              {wanted.length > 0 && (
                <div>
                  <p className="muted" style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: 6,
                    textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wants to learn</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {wanted.map(s => <span key={s.id} className="pill pill-want">◈ {s.skillName}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Projects preview (first 2) if any */}
          {projects.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>Projects</h3>
                {projects.length > 2 && (
                  <button className="btn btn-outline btn-sm" onClick={() => setTab('projects')}>
                    View all {projects.length}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {projects.slice(0, 2).map((p, i) => <ProjectCard key={i} project={p} />)}
              </div>
            </div>
          )}

          {/* Learning platforms */}
          {platforms.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginBottom: 10 }}>Learning platforms</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {platforms.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer"
                    style={{ fontSize: '0.88rem', color: 'var(--color-give)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    📚 <span style={{ color: 'var(--color-ink)' }}>{extractPlatformName(url)}</span>
                    <span className="muted" style={{ fontSize: '0.78rem' }}>{url.replace(/^https?:\/\//, '').split('/')[0]}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {offered.length === 0 && wanted.length === 0 && projects.length === 0 && !hasSocialLinks && (
            <div className="empty-state">
              <h3>Nothing here yet</h3>
              <p>This user hasn't added skills or links to their profile.</p>
            </div>
          )}
        </>
      )}

      {/* ════════════ PROJECTS tab ════════════ */}
      {tab === 'projects' && (
        <div>
          {projects.length === 0 ? (
            <div className="empty-state"><h3>No projects listed</h3></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {projects.map((p, i) => <ProjectCard key={i} project={p} />)}
            </div>
          )}
        </div>
      )}

      {/* ════════════ REVIEWS tab ════════════ */}
      {tab === 'reviews' && (
        <div>
          {reviews.length === 0 ? (
            <div className="empty-state">
              <h3>No reviews yet</h3>
              <p>Reviews appear here after completed sessions.</p>
            </div>
          ) : (
            <div className="card-list">
              {reviews.map(r => (
                <div key={r.sessionId} className="card">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--color-want-bg)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '1rem', overflow: 'hidden',
                    }}>
                      {r.reviewerPhotoUrl
                        ? <img src={resolvePhotoUrl(API, r.reviewerPhotoUrl)} alt={r.reviewerName}
                               style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : r.reviewerName?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 4 }}>
                        <div>
                          <span style={{ fontWeight: 700 }}>{r.reviewerName}</span>
                          <span className="muted" style={{ fontSize: '0.82rem', marginLeft: 8 }}>
                            on "{r.skill}"
                            {r.sessionDate && ` · ${new Date(r.sessionDate).toLocaleDateString(undefined,
                              { month: 'short', day: 'numeric', year: 'numeric' })}`}
                          </span>
                        </div>
                      </div>
                      <div style={{ marginBottom: r.review ? 8 : 0, maxWidth: 280 }}>
                        <RatingBar value={r.rating} />
                      </div>
                      {r.review && (
                        <p style={{
                          margin: 0, fontSize: '0.9rem', color: 'var(--color-ink)',
                          background: 'var(--color-bg)', padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-give)',
                        }}>
                          "{r.review}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Request modal ── */}
      {showRequest && (
        <div role="dialog" aria-modal="true" style={{
          position: 'fixed', inset: 0, background: 'rgba(28,35,33,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 50,
        }}>
          <div className="card" style={{ maxWidth: 440, width: '100%' }}>
            <h3>Request session with {profile.name}</h3>
            <p className="muted" style={{ fontSize: '0.88rem', marginBottom: 14 }}>
              {me?.userType === 'LEARNER'
                ? 'One-way learning — 25 points deducted if accepted.'
                : 'Barter exchange — no points required.'}
            </p>

            {suggested.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p className="muted" style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 6 }}>
                  MATCHING SKILLS
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {suggested.map(s => (
                    <button key={s} onClick={() => setRequestSkill(s)} style={{
                      padding: '4px 12px', borderRadius: 999, border: '1px solid',
                      borderColor: requestSkill === s ? 'var(--color-give)' : 'var(--color-border)',
                      background: requestSkill === s ? 'var(--color-give-bg)' : 'transparent',
                      color: requestSkill === s ? 'var(--color-give)' : 'var(--color-ink)',
                      cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="field">
              <label>Skill you want to learn</label>
              <input value={requestSkill} onChange={e => setRequestSkill(e.target.value)}
                placeholder="Which skill specifically?" />
            </div>
            <div className="field">
              <label>Message (optional)</label>
              <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Tell them what you'd like to learn…" />
            </div>

            {reqFeedback === 'success'
              ? <p style={{ color: 'var(--color-success)', fontWeight: 600 }}>✓ Request sent!</p>
              : reqFeedback && <div className="error-banner">{reqFeedback}</div>}

            <div className="card-row">
              <button className="btn btn-outline" onClick={() => setShowRequest(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={sending} onClick={sendRequest}>
                {sending ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Project card ──────────────────────────────────────────────────────────────

function ProjectCard({ project: p }) {
  return (
    <div style={{
      border: '1px solid var(--color-border)', borderRadius: 10,
      padding: '14px 16px', background: 'var(--color-bg)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: '0.95rem' }}>{p.title}</p>
          {p.description && (
            <p className="muted" style={{ fontSize: '0.84rem', margin: '0 0 8px', lineHeight: 1.4 }}>
              {p.description}
            </p>
          )}
          {p.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: p.url ? 8 : 0 }}>
              {p.tags.map(t => (
                <span key={t} style={{
                  fontSize: '0.72rem', padding: '2px 9px', borderRadius: 99,
                  background: 'var(--color-give-bg)', color: 'var(--color-give)', fontWeight: 600,
                }}>{t}</span>
              ))}
            </div>
          )}
        </div>
        {p.url && (
          <a href={p.url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"
            style={{ flexShrink: 0, fontSize: '0.78rem' }}>
            View →
          </a>
        )}
      </div>
      {p.url && (
        <p className="muted" style={{ fontSize: '0.76rem', margin: '4px 0 0' }}>
          🔗 {p.url.replace(/^https?:\/\//, '')}
        </p>
      )}
    </div>
  );
}

// ── Utility: extract a readable name from a learning platform URL ─────────────

function extractPlatformName(url) {
  try {
    const host = new URL(url.startsWith('http') ? url : 'https://' + url).hostname.replace('www.', '');
    const known = {
      'coursera.org': 'Coursera', 'udemy.com': 'Udemy', 'edx.org': 'edX',
      'freecodecamp.org': 'freeCodeCamp', 'leetcode.com': 'LeetCode',
      'hackerrank.com': 'HackerRank', 'kaggle.com': 'Kaggle',
      'pluralsight.com': 'Pluralsight', 'linkedin.com': 'LinkedIn Learning',
      'skillshare.com': 'Skillshare', 'codecademy.com': 'Codecademy',
      'khanacademy.org': 'Khan Academy',
    };
    return known[host] || host.split('.')[0].charAt(0).toUpperCase() + host.split('.')[0].slice(1);
  } catch {
    return 'Platform';
  }
}
