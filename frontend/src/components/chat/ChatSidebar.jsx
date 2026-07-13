import { useNavigate } from 'react-router-dom';
import OnlineStatus from './OnlineStatus';

const API = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';

function formatLastMsg(room, myId) {
  if (!room.lastMessage) return 'No messages yet';
  const mine = room.lastMessage.senderId === myId;
  const text = room.lastMessage.content;
  return (mine ? 'You: ' : '') + (text.length > 40 ? text.slice(0, 40) + '…' : text);
}

export default function ChatSidebar({ rooms, activeRoomId, myId, onlineUsers, loading }) {
  const navigate = useNavigate();

  return (
    <div style={{
      width: 300, flexShrink: 0, borderRight: '1px solid var(--color-border)',
      background: 'var(--color-surface)', display: 'flex', flexDirection: 'column',
      height: '100%',
    }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--color-border)' }}>
        <h3 style={{ margin: 0 }}>Chats</h3>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {loading && <p className="muted" style={{ padding: 16 }}>Loading…</p>}
        {!loading && rooms.length === 0 && (
          <div style={{ padding: 20, color: 'var(--color-ink-soft)', fontSize: '0.88rem' }}>
            No chats yet. Accept a session request to start chatting.
          </div>
        )}
        {rooms.map(room => {
          const otherId = room.user1Id === myId ? room.user2Id : room.user1Id;
          const otherName = room.user1Id === myId ? room.user2Name : room.user1Name;
          const otherPhoto = room.user1Id === myId ? room.user2Photo : room.user1Photo;
          const isOnline = onlineUsers.has(otherId);
          const isActive = room.id === activeRoomId;

          return (
            <div key={room.id}
              onClick={() => navigate(`/chat/${room.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', cursor: 'pointer',
                background: isActive ? 'var(--color-give-bg)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--color-give)' : '3px solid transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-bg)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Avatar with presence dot */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'var(--color-give-bg)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '1.1rem', overflow: 'hidden',
                }}>
                  {otherPhoto
                    ? <img src={API + otherPhoto} alt={otherName}
                           style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : otherName?.[0]?.toUpperCase()}
                </div>
                <span style={{
                  position: 'absolute', bottom: 1, right: 1,
                  width: 11, height: 11, borderRadius: '50%',
                  background: isOnline ? '#2F8F5B' : '#bbb',
                  border: '2px solid white',
                }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{otherName}</span>
                  {room.unreadCount > 0 && (
                    <span style={{
                      background: 'var(--color-give)', color: 'white', fontSize: '0.7rem',
                      fontWeight: 700, minWidth: 18, height: 18, borderRadius: 999,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                    }}>
                      {room.unreadCount}
                    </span>
                  )}
                </div>
                <p style={{
                  margin: 0, fontSize: '0.8rem', color: 'var(--color-ink-soft)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {formatLastMsg(room, myId)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
