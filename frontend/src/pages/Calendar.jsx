import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sessionService } from '../api/sessionService';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function parseSessionDate(s) {
  if (!s.scheduledTime) return null;
  try { return new Date(s.scheduledTime); } catch { return null; }
}

export default function Calendar() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(new Date());
  const [cursor, setCursor] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });
  const [selected, setSelected] = useState(null); // Date object

  useEffect(() => {
    sessionService.mySessions().then(data => { setSessions(data); setLoading(false); });
  }, []);

  // Map "YYYY-MM-DD" -> list of sessions
  const byDate = {};
  sessions.forEach(s => {
    const d = parseSessionDate(s);
    if (!d) return;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(s);
  });

  const sessionsOnSelected = selected
    ? (byDate[`${selected.getFullYear()}-${selected.getMonth()}-${selected.getDate()}`] || [])
    : [];

  // Build grid cells
  const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d) => d === today.getDate() && cursor.month === today.getMonth() && cursor.year === today.getFullYear();
  const isSelected = (d) => selected && d === selected.getDate() && cursor.month === selected.getMonth() && cursor.year === selected.getFullYear();
  const hasSessions = (d) => !!byDate[`${cursor.year}-${cursor.month}-${d}`];

  const prevMonth = () => setCursor(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const nextMonth = () => setCursor(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });

  const counterpart = (s) => (s.user1Id === user.id ? s.user2Name : s.user1Name);

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Calendar</h1><p>All your scheduled sessions at a glance.</p></div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* ── Month grid ── */}
        <div className="card" style={{ flex: '1 1 340px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button className="btn btn-outline btn-sm" onClick={prevMonth}>‹</button>
            <h3 style={{ margin: 0 }}>{MONTHS[cursor.month]} {cursor.year}</h3>
            <button className="btn btn-outline btn-sm" onClick={nextMonth}>›</button>
          </div>

          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem',
                fontWeight: 700, color: 'var(--color-ink-soft)', padding: '4px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Date cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((d, i) => (
              <div key={i}
                onClick={() => d && setSelected(new Date(cursor.year, cursor.month, d))}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)',
                  cursor: d ? 'pointer' : 'default',
                  background: isSelected(d) ? 'var(--color-give)' :
                              isToday(d)    ? 'var(--color-give-bg)' : 'transparent',
                  color: isSelected(d) ? 'white' : 'var(--color-ink)',
                  fontWeight: isToday(d) || isSelected(d) ? 700 : 400,
                  fontSize: '0.88rem',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (d && !isSelected(d)) e.currentTarget.style.background = 'var(--color-bg)'; }}
                onMouseLeave={e => { if (d && !isSelected(d)) e.currentTarget.style.background = 'transparent'; }}
              >
                {d || ''}
                {d && hasSessions(d) && (
                  <span style={{
                    position: 'absolute', bottom: 3,
                    width: 5, height: 5, borderRadius: '50%',
                    background: isSelected(d) ? 'rgba(255,255,255,0.8)' : 'var(--color-give)',
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: '0.78rem', color: 'var(--color-ink-soft)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-give)', display: 'inline-block' }} />
              Has session
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--color-give-bg)', display: 'inline-block' }} />
              Today
            </span>
          </div>
        </div>

        {/* ── Day detail panel ── */}
        <div className="card" style={{ flex: '1 1 280px', minHeight: 200 }}>
          {!selected ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <h3>Pick a date</h3>
              <p>Click any day on the calendar to see sessions scheduled for that day.</p>
            </div>
          ) : (
            <>
              <h3 style={{ marginBottom: 14 }}>
                {selected.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {loading && <p className="muted">Loading…</p>}
              {!loading && sessionsOnSelected.length === 0 && (
                <p className="muted">No sessions on this day.</p>
              )}
              <div className="card-list">
                {sessionsOnSelected.map(s => {
                  const d = parseSessionDate(s);
                  return (
                    <div key={s.id} style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ fontWeight: 700, margin: '0 0 2px' }}>{s.skill}</p>
                          <p className="muted" style={{ fontSize: '0.83rem', margin: '0 0 6px' }}>
                            with {counterpart(s)}
                          </p>
                          {d && (
                            <p className="muted" style={{ fontSize: '0.8rem', margin: '0 0 6px' }}>
                              🕐 {d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                          {s.meetingLink && (s.status === 'SCHEDULED' || s.status === 'ONGOING') && (
                            <a href={s.meetingLink} target="_blank" rel="noreferrer"
                              className="btn btn-give btn-sm" style={{ display: 'inline-flex', marginTop: 4 }}>
                              Join meeting
                            </a>
                          )}
                        </div>
                        <span className={`status status-${s.status}`}>{s.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Upcoming sessions list ── */}
      <h2 style={{ marginTop: 32, marginBottom: 14 }}>Upcoming sessions</h2>
      {loading ? <p className="muted">Loading…</p> : (() => {
        const upcoming = sessions
          .filter(s => s.status === 'SCHEDULED' && parseSessionDate(s) > new Date())
          .sort((a, b) => parseSessionDate(a) - parseSessionDate(b));
        if (upcoming.length === 0) return (
          <div className="empty-state">
            <h3>Nothing coming up</h3>
            <p>Accepted requests will appear here once scheduled.</p>
          </div>
        );
        return (
          <div className="card-list">
            {upcoming.map(s => {
              const d = parseSessionDate(s);
              return (
                <div key={s.id} className="card">
                  <div className="card-row">
                    <div>
                      <h3 style={{ marginBottom: 2 }}>{s.skill} with {counterpart(s)}</h3>
                      <p className="muted" style={{ margin: '0 0 6px', fontSize: '0.85rem' }}>
                        {d?.toLocaleString(undefined, {
                          weekday: 'short', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                      <span className="pill pill-neutral" style={{ marginRight: 6 }}>
                        {s.oneWay ? 'One-way' : 'Barter'}
                      </span>
                    </div>
                    {s.meetingLink && (
                      <a href={s.meetingLink} target="_blank" rel="noreferrer"
                        className="btn btn-give btn-sm">
                        Join meeting
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
