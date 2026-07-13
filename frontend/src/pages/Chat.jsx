import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../api/chatService';
import { connect, disconnect, subscribe } from '../api/websocket';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';

export default function Chat() {
  const { roomId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [wsReady, setWsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const unsubPresence = useRef(null);

  // ── Load rooms ────────────────────────────────────────────────────────────
  const loadRooms = async () => {
    const data = await chatService.getRooms();
    setRooms(data);
    return data;
  };

  // ── Connect WebSocket and set up presence ─────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Load rooms first so sidebar renders quickly
        const data = await loadRooms();

        // Seed presence from REST
        const onlineIds = await chatService.presence();
        if (mounted) setOnlineUsers(new Set(onlineIds));

        // Connect WebSocket
        await connect(token);
        if (!mounted) return;

        setWsReady(true);

        // Subscribe to global presence channel
        unsubPresence.current = subscribe('/topic/presence', (event) => {
          setOnlineUsers(prev => {
            const next = new Set(prev);
            if (event.status === 'ONLINE') next.add(event.userId);
            else next.delete(event.userId);
            return next;
          });
        });

        // If a roomId is in the URL, activate that room
        if (roomId) {
          const room = data.find(r => r.id === Number(roomId));
          if (room) setActiveRoom(room);
          else {
            // May be a new room not yet in the list - fetch it
            try {
              const fresh = await chatService.getRoom(Number(roomId));
              setActiveRoom(fresh);
            } catch { navigate('/chat'); }
          }
        }
      } catch (err) {
        console.error('Chat init failed:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
      unsubPresence.current?.();
      disconnect();
    };
  }, []);

  // ── Activate room when URL changes ────────────────────────────────────────
  useEffect(() => {
    if (!roomId) { setActiveRoom(null); return; }
    const room = rooms.find(r => r.id === Number(roomId));
    if (room) setActiveRoom(room);
  }, [roomId, rooms]);

  const handleNewMessage = () => {
    loadRooms(); // Refresh sidebar to update last-message / unread count
  };

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - 57px)', // subtract navbar height
      background: 'var(--color-bg)',
    }}>
      <ChatSidebar
        rooms={rooms}
        activeRoomId={activeRoom?.id}
        myId={user.id}
        onlineUsers={onlineUsers}
        loading={loading}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!activeRoom ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-ink-soft)', gap: 12,
          }}>
            <span style={{ fontSize: '3rem' }}>💬</span>
            <h3 style={{ margin: 0 }}>Select a chat</h3>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>
              Pick a conversation from the sidebar, or accept a session request to start one.
            </p>
          </div>
        ) : wsReady ? (
          <ChatWindow
            key={activeRoom.id}
            room={activeRoom}
            onlineUsers={onlineUsers}
            onNewMessage={handleNewMessage}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className="muted">Connecting…</p>
          </div>
        )}
      </div>
    </div>
  );
}
