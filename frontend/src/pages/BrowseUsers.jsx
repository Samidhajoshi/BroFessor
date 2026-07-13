import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../api/userService';
import { requestService } from '../api/requestService';
import UserCard from '../components/UserCard';
import { checkCompatibility, matchingSkills } from '../utils/compatibility';

export default function BrowseUsers() {
  const { user } = useAuth();

  // Search mode: 'skill' or 'name'
  const [searchMode, setSearchMode] = useState('skill');
  const [skillQuery, setSkillQuery] = useState('');
  const [nameQuery,  setNameQuery]  = useState('');

  const [results,  setResults]  = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [searchErr, setSearchErr] = useState('');

  // Request modal state
  const [requestTarget, setRequestTarget] = useState(null);
  const [comment,       setComment]       = useState('');
  const [requestSkill,  setRequestSkill]  = useState('');
  const [sending,       setSending]       = useState(false);
  const [feedback,      setFeedback]      = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchErr('');
    if (searchMode === 'skill' && !skillQuery.trim()) return;
    if (searchMode === 'name'  && !nameQuery.trim())  return;
    setLoading(true); setSearched(true);
    try {
      let data;
      if (searchMode === 'skill') {
        data = await userService.search(skillQuery.trim());
      } else {
        data = await userService.searchByName(nameQuery.trim());
      }
      setResults(data);
    } catch (err) {
      setSearchErr(err.response?.data?.message || 'Search failed. Please try again.');
    } finally { setLoading(false); }
  };

  const openRequest = (target) => {
    setRequestTarget(target);
    setComment('');
    setFeedback('');
    if (user.userType === 'LEARNER') {
      // Pre-fill with a skill that actually matches the learner's WANT list
      const matches = matchingSkills(user, target);
      setRequestSkill(matches[0] || '');
    } else {
      // Pre-fill with searched skill if in skill mode, otherwise empty
      setRequestSkill(searchMode === 'skill' ? skillQuery.trim() : '');
    }
  };

  const sendRequest = async () => {
    if (!requestSkill.trim()) { setFeedback('Specify the skill you want to learn.'); return; }
    setSending(true); setFeedback('');
    try {
      await requestService.send({
        receiverId: requestTarget.id,
        skillWanted: requestSkill.trim(),
        comment,
      });
      setFeedback('success');
      setTimeout(() => setRequestTarget(null), 1500);
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Could not send the request.');
    } finally { setSending(false); }
  };

  const tabStyle = (mode) => ({
    padding: '8px 20px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontWeight: searchMode === mode ? 700 : 400,
    color: searchMode === mode ? 'var(--color-give)' : '#6b7280',
    borderBottom: searchMode === mode ? '2px solid var(--color-give)' : '2px solid transparent',
    marginBottom: -2,
    fontSize: '0.92rem',
    fontFamily: 'inherit',
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Browse users</h1>
          <p>Search by skill to find a teacher, or by name to find someone specific.</p>
        </div>
      </div>

      {/* Search mode tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)', marginBottom: 18 }}>
        <button style={tabStyle('skill')} onClick={() => { setSearchMode('skill'); setResults([]); setSearched(false); }}>
          🎯 Search by skill
        </button>
        <button style={tabStyle('name')} onClick={() => { setSearchMode('name'); setResults([]); setSearched(false); }}>
          🔍 Search by name
        </button>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch}
        className="card-row" style={{ marginBottom: 24, alignItems: 'flex-end' }}>
        {searchMode === 'skill' ? (
          <div className="field" style={{ flex: 1, marginBottom: 0, minWidth: 220 }}>
            <label htmlFor="skillWanted">Skill to learn</label>
            <input id="skillWanted" value={skillQuery}
              onChange={e => setSkillQuery(e.target.value)}
              placeholder="e.g. Photoshop, Spanish, Guitar…" />
          </div>
        ) : (
          <div className="field" style={{ flex: 1, marginBottom: 0, minWidth: 220 }}>
            <label htmlFor="nameQuery">User's name</label>
            <input id="nameQuery" value={nameQuery}
              onChange={e => setNameQuery(e.target.value)}
              placeholder="e.g. Rahul, Priya…" />
          </div>
        )}
        <button type="submit" className="btn btn-give" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {searchErr && <div className="error-banner" style={{ marginBottom: 16 }}>{searchErr}</div>}

      {searched && !loading && results.length === 0 && (
        <div className="empty-state">
          <h3>No matches found</h3>
          <p>
            {searchMode === 'skill'
              ? 'Nobody currently offers that skill. Try a broader search term.'
              : 'No user found with that name. Try a different spelling.'}
          </p>
        </div>
      )}

      <div className="card-list">
        {results.map(u => {
          const compat = checkCompatibility(user, u);
          return (
            <UserCard key={u.id} user={u}
              action={
                compat.compatible ? (
                  <button className="btn btn-primary btn-sm" onClick={() => openRequest(u)}>
                    Request session
                  </button>
                ) : (
                  <span
                    title={compat.reason}
                    className="muted"
                    style={{
                      fontSize: '0.78rem',
                      maxWidth: 160,
                      textAlign: 'right',
                      lineHeight: 1.3,
                    }}
                  >
                    ⚠ Not compatible
                  </span>
                )
              }
            />
          );
        })}
      </div>

      {/* Request modal */}
      {requestTarget && (
        <div role="dialog" aria-modal="true" style={{
          position: 'fixed', inset: 0, background: 'rgba(28,35,33,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, zIndex: 50,
        }}>
          <div className="card" style={{ maxWidth: 440, width: '100%' }}>
            <h3>Request session with {requestTarget.name}</h3>
            <p className="muted" style={{ fontSize: '0.88rem', marginBottom: 14 }}>
              {user.userType === 'LEARNER'
                ? 'One-way learning request — 25 points deducted if accepted.'
                : 'Barter exchange — no points involved.'}
            </p>

            <div className="field">
              <label htmlFor="reqSkill">Skill you want to learn</label>
              <input id="reqSkill" value={requestSkill}
                onChange={e => setRequestSkill(e.target.value)}
                placeholder="Which skill specifically?" />
              {/* Show quick-pick chips: matched skills only for learners, all offered skills for barter */}
              {(() => {
                const chipSkills = user.userType === 'LEARNER'
                  ? matchingSkills(user, requestTarget)
                  : (requestTarget.skills || []).filter(s => s.type === 'OFFER').map(s => s.skillName);
                if (chipSkills.length === 0) return null;
                return (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {chipSkills.map(name => (
                      <button key={name} type="button"
                        onClick={() => setRequestSkill(name)}
                        style={{
                          padding: '3px 12px', borderRadius: 999, border: '1px solid',
                          borderColor: requestSkill === name ? 'var(--color-give)' : 'var(--color-border)',
                          background: requestSkill === name ? 'var(--color-give-bg)' : 'transparent',
                          color: requestSkill === name ? 'var(--color-give)' : 'var(--color-ink-soft)',
                          cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit',
                        }}>
                        {name}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="field">
              <label htmlFor="comment">Message (optional)</label>
              <textarea id="comment" rows={3} value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Tell them what you'd like to learn…" />
            </div>

            {feedback === 'success'
              ? <p style={{ color: 'var(--color-success)', fontWeight: 600 }}>✓ Request sent!</p>
              : feedback && <div className="error-banner">{feedback}</div>}

            <div className="card-row">
              <button className="btn btn-outline" onClick={() => setRequestTarget(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={sendRequest} disabled={sending}>
                {sending ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
