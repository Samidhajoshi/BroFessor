import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  const scrollToAbout = () => {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: '#1a0a0e' }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;0,700;1,400;1,600&family=Inter:wght@400;500;600&display=swap');

        @keyframes float1 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-18px) scale(1.03)} }
        @keyframes float2 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(14px) scale(0.97)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

        .land-btn {
          padding: 11px 26px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.18s ease;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.01em;
        }
        .land-btn:hover { transform: translateY(-1px); }
        .land-btn:active { transform: translateY(0); }

        .nav-about {
          background: transparent;
          color: #d4b896;
          border: 1px solid rgba(212,184,150,0.3);
          padding: 9px 22px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.18s ease;
        }
        .nav-about:hover {
          background: rgba(212,184,150,0.1);
          border-color: rgba(212,184,150,0.6);
        }

        .feature-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(212,184,150,0.12);
          border-radius: 16px;
          padding: 28px 24px;
          transition: all 0.2s ease;
        }
        .feature-card:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(212,184,150,0.25);
          transform: translateY(-3px);
        }

        .step-pill {
          display: inline-block;
          background: rgba(139,35,55,0.25);
          color: #e8a0b0;
          border: 1px solid rgba(139,35,55,0.4);
          border-radius: 999px;
          padding: 4px 14px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
      `}</style>

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 48px',
        background: 'rgba(26,10,14,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(212,184,150,0.1)',
      }}>
        <span style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 22, fontWeight: 700, color: '#f5ede3',
          letterSpacing: '-0.01em'
        }}>
          <span style={{ color: '#f5ede3' }}>BRO</span>
          <span style={{ color: '#c97d7d', fontStyle: 'italic' }}>fessor</span>
        </span>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="nav-about" onClick={scrollToAbout}>About</button>
          <button className="land-btn" onClick={() => navigate('/login')}
            style={{ background: 'transparent', color: '#d4b896', border: '1px solid rgba(212,184,150,0.4)' }}>
            Login
          </button>
          <button className="land-btn" onClick={() => navigate('/register')}
            style={{ background: 'linear-gradient(135deg, #8b2337, #6b3a5a)', color: '#fff', boxShadow: '0 2px 12px rgba(139,35,55,0.4)' }}>
            Sign Up
          </button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse 80% 70% at 50% 40%, #3d1520 0%, #1a0a0e 60%)',
        paddingTop: 80,
      }}>
        {/* Ambient blobs */}
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,35,55,0.18) 0%, transparent 70%)',
          top: '10%', left: '-10%', animation: 'float1 8s ease-in-out infinite',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(107,84,60,0.15) 0%, transparent 70%)',
          bottom: '5%', right: '-5%', animation: 'float2 10s ease-in-out infinite',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(90,55,80,0.12) 0%, transparent 70%)',
          top: '40%', right: '15%', animation: 'float1 12s ease-in-out infinite 2s',
          pointerEvents: 'none'
        }} />

        {/* Content */}
        <div style={{ textAlign: 'center', padding: '0 24px', maxWidth: 720, animation: 'fadeUp 0.9s ease both' }}>
          <div style={{
            display: 'inline-block', marginBottom: 24,
            background: 'rgba(139,35,55,0.2)', border: '1px solid rgba(139,35,55,0.35)',
            borderRadius: 999, padding: '6px 18px',
            fontSize: 13, color: '#e8a0b0', fontWeight: 500, letterSpacing: '0.04em'
          }}>
             Peer-to-Peer Skill Exchange Platform
          </div>

          <h1 style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 'clamp(52px, 9vw, 96px)',
            fontWeight: 700, lineHeight: 1.0,
            margin: '0 0 24px',
            color: '#f5ede3',
            letterSpacing: '-0.03em',
          }}>
            <span style={{ color: '#f5ede3' }}>BRO</span>
            <span style={{
              color: '#c97d7d', fontStyle: 'italic',
              textShadow: '0 0 40px rgba(201,125,125,0.3)'
            }}>fessor</span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            color: '#b8a090', lineHeight: 1.65,
            maxWidth: 540, margin: '0 auto 36px',
          }}>
            Trade skills, not money. Connect with people who know what you want to learn — and want to learn what you know.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="land-btn" onClick={() => navigate('/register')} style={{
              background: 'linear-gradient(135deg, #8b2337 0%, #6b3a5a 100%)',
              color: '#fff', fontSize: 15, padding: '14px 32px',
              boxShadow: '0 4px 24px rgba(139,35,55,0.45)',
            }}>
              Start Exchanging →
            </button>
            <button className="land-btn" onClick={scrollToAbout} style={{
              background: 'rgba(255,255,255,0.06)', color: '#d4b896',
              border: '1px solid rgba(212,184,150,0.25)', fontSize: 15, padding: '14px 32px',
            }}>
              Learn More
            </button>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: 40, justifyContent: 'center', marginTop: 56,
            flexWrap: 'wrap'
          }}>
            {[['Share Skills'], ['Learn'], ['Grow']].map(([label, val]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: '#e8c4a0' }}>{val}</div>
                <div style={{ fontSize: 12, color: '#8a7060', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ──────────────────────────────────────────────────── */}
      <section id="about" style={{
        background: 'linear-gradient(180deg, #1a0a0e 0%, #0f1a10 40%, #121a0e 100%)',
        padding: '96px 24px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Label */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span className="step-pill">About Brofessor</span>
          </div>

          <h2 style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700,
            color: '#f5ede3', textAlign: 'center', margin: '0 0 20px',
            letterSpacing: '-0.02em'
          }}>
            A new way to learn —<br />
            <span style={{ color: '#7ab87a', fontStyle: 'italic' }}>by teaching.</span>
          </h2>

          <p style={{
            fontSize: 17, color: '#8a9e8a', lineHeight: 1.75,
            maxWidth: 640, margin: '0 auto 64px', textAlign: 'center'
          }}>
            Brofessor is a peer-to-peer skill exchange platform that connects learners and mentors based on complementary skills. Users can create profiles, match with others, chat in real time, schedule learning sessions, share meeting links, and rate completed sessions. The platform also includes an AI-powered Profile Analyzer that evaluates profile quality and provides personalized recommendations to help users improve their visibility, credibility, and learning opportunities.
          </p>

          {/* Feature cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              { icon: '⇄', title: 'Skill Matching', desc: 'Offer what you know, request what you want. The platform surfaces compatible exchange partners automatically.' },
              { icon: '💬', title: 'Real-Time Chat', desc: 'Message your matches instantly with typing indicators, read receipts, and online presence — no email chains.' },
              { icon: '📅', title: 'Session Scheduling', desc: 'Book sessions with built-in calendar, meeting links, and reminders so nothing falls through the cracks.' },
              { icon: '✦', title: 'AI Profile Analyzer', desc: 'Get a scored breakdown of your profile with Groq-powered recommendations to boost your credibility.' },
              { icon: '⭐', title: 'Ratings & Reviews', desc: 'Rate every session and build a verified reputation that makes future matches more trustworthy.' },
              { icon: '🔔', title: 'Notifications', desc: 'Stay informed on requests, session reminders, and messages without having to check manually.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="feature-card">
                <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
                <h3 style={{
                  fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600,
                  color: '#e8d4c0', margin: '0 0 8px'
                }}>{title}</h3>
                <p style={{ fontSize: 13.5, color: '#7a8a7a', lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section style={{
        background: '#0d1209',
        padding: '96px 24px',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <span className="step-pill">How It Works</span>
          <h2 style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700,
            color: '#f5ede3', margin: '12px 0 56px', letterSpacing: '-0.02em'
          }}>
            Three steps to your first exchange
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { num: '01', title: 'Build your profile', desc: 'List what you can teach and what you want to learn. Add GitHub, LinkedIn, and projects.' },
              { num: '02', title: 'Find your match', desc: 'Browse users whose skills complement yours. Send a session request in one click.' },
              { num: '03', title: 'Exchange & grow', desc: 'Schedule a session, meet on video, rate each other. Your reputation builds with every exchange.' },
            ].map(({ num, title, desc }) => (
              <div key={num} style={{ textAlign: 'left' }}>
                <div style={{
                  fontFamily: "'Fraunces', serif", fontSize: 48, fontWeight: 700,
                  color: 'rgba(139,35,55,0.3)', lineHeight: 1, marginBottom: 12
                }}>{num}</div>
                <h3 style={{
                  fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600,
                  color: '#e8d4c0', margin: '0 0 8px'
                }}>{title}</h3>
                <p style={{ fontSize: 13.5, color: '#6a7a6a', lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #2a0d16 0%, #1a1a2e 50%, #0d1a0d 100%)',
        padding: '96px 24px', textAlign: 'center',
        borderTop: '1px solid rgba(212,184,150,0.08)'
      }}>
        <h2 style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 700,
          color: '#f5ede3', margin: '0 0 16px', letterSpacing: '-0.02em'
        }}>
          Ready to trade your first skill?
        </h2>
        <p style={{ fontSize: 16, color: '#8a7060', marginBottom: 36 }}>
          Join Brofessor free. No credit card required.
        </p>
        <button className="land-btn" onClick={() => navigate('/register')} style={{
          background: 'linear-gradient(135deg, #8b2337 0%, #6b3a5a 100%)',
          color: '#fff', fontSize: 16, padding: '15px 40px',
          boxShadow: '0 4px 28px rgba(139,35,55,0.5)',
        }}>
          Create Your Profile →
        </button>
        <div style={{ marginTop: 24, fontSize: 13, color: '#5a4a40' }}>
          Already have an account?{' '}
          <span onClick={() => navigate('/login')} style={{ color: '#c97d7d', cursor: 'pointer', fontWeight: 600 }}>
            Log in
          </span>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{
        background: '#0a060a', borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12
      }}>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, color: '#3a2a2a', fontWeight: 700 }}>
          BRO<span style={{ fontStyle: 'italic', color: '#4a2a2a' }}>fessor</span>
        </span>
        <span style={{ fontSize: 12, color: '#3a3030' }}>© 2026 Brofessor. All rights reserved.</span>
      </footer>
    </div>
  );
}
