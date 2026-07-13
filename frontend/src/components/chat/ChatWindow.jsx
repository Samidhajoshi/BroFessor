import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatService } from '../../api/chatService';
import { publish, subscribe } from '../../api/websocket';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import OnlineStatus from './OnlineStatus';

const API = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8080';

export default function ChatWindow({ room, onlineUsers, onNewMessage }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const isTyping = useRef(false);

  const otherId   = room.user1Id === user.id ? room.user2Id   : room.user1Id;
  const otherName = room.user1Id === user.id ? room.user2Name : room.user1Name;
  const otherPhoto = room.user1Id === user.id ? room.user2Photo : room.user1Photo;
  const isOnline  = onlineUsers.has(otherId);

  // ── Load history ─────────────────────────────────────────────────────────
  useEffect(() => {
    chatService.getMessages(room.id).then(setMessages);
    chatService.markRead(room.id);
  }, [room.id]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  // ── Subscribe to room messages ────────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribe(`/topic/chat/${room.id}`, (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.senderId !== user.id) {
        chatService.markRead(room.id);
        onNewMessage?.();
      }
    });

    const unsubRead = subscribe(`/topic/chat/${room.id}/read`, () => {
      setMessages(prev => prev.map(m =>
        m.senderId === user.id ? { ...m, readStatus: 'READ' } : m));
    });

    return () => { unsub(); unsubRead(); };
  }, [room.id, user.id]);

  // ── Subscribe to typing ───────────────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribe(`/topic/chat/${room.id}/typing`, (event) => {
      if (event.userId === user.id) return;
      if (event.typing) {
        setTypingUser(event.userName);
      } else {
        setTypingUser(null);
      }
    });
    return unsub;
  }, [room.id, user.id]);

  // ── Typing indicator ──────────────────────────────────────────────────────
  const sendTyping = useCallback((typing) => {
    publish('/app/chat.typing', { roomId: room.id, userId: user.id, userName: user.name, typing });
  }, [room.id, user.id, user.name]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!isTyping.current) {
      isTyping.current = true;
      sendTyping(true);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTyping.current = false;
      sendTyping(false);
    }, 3000);
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    clearTimeout(typingTimer.current);
    isTyping.current = false;
    sendTyping(false);
    setInput('');

    try {
      publish('/app/chat.sendMessage', {
        roomId: room.id,
        senderId: user.id,
        receiverId: otherId,
        content: text,
        messageType: 'TEXT',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Group messages by sender for avatar display ───────────────────────────
  const enriched = messages.map((msg, i) => {
    const currDateKey = msg.sentAt?.slice(0, 10);
    const prevDateKey = i === 0 ? null : messages[i - 1]?.sentAt?.slice(0, 10);
    return {
      ...msg,
      showAvatar: i === 0 || messages[i - 1]?.senderId !== msg.senderId,
      showDateDivider: i === 0 || currDateKey !== prevDateKey,
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{
        padding: '12px 18px', borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--color-surface)',
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: 'var(--color-give-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {otherPhoto
              ? <img src={API + otherPhoto} alt={otherName}
                     style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : otherName?.[0]?.toUpperCase()}
          </div>
          <span style={{
            position: 'absolute', bottom: 1, right: 1, width: 10, height: 10,
            borderRadius: '50%', background: isOnline ? '#2F8F5B' : '#bbb',
            border: '2px solid white',
          }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{otherName}</div>
          <OnlineStatus isOnline={isOnline} showLabel />
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 16px 8px',
        background: '#f0f0f0',
        display: 'flex', flexDirection: 'column',
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-ink-soft)', fontSize: '0.88rem', gap: 6,
          }}>
            <span style={{ fontSize: '2rem' }}>👋</span>
            <p style={{ margin: 0 }}>Say hello to {otherName}!</p>
            <p style={{ margin: 0, fontSize: '0.78rem' }}>This chat was created for your session.</p>
          </div>
        )}
        {enriched.map((msg, i) => (
          <MessageBubble
            key={msg.id ?? `temp-${i}`}
            message={msg}
            isMine={msg.senderId === user.id}
            showAvatar={msg.showAvatar}
            showDateDivider={msg.showDateDivider}
          />
        ))}
        <TypingIndicator name={typingUser} />
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid var(--color-border)',
        background: 'var(--color-surface)', display: 'flex', gap: 10, alignItems: 'flex-end',
      }}>
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          style={{
            flex: 1, resize: 'none', padding: '10px 14px',
            border: '1px solid var(--color-border)', borderRadius: 20,
            background: 'var(--color-bg)', fontSize: '0.92rem', outline: 'none',
            maxHeight: 120, overflowY: 'auto', lineHeight: 1.4,
            fontFamily: 'inherit',
          }}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{
            width: 42, height: 42, borderRadius: '50%', border: 'none',
            background: input.trim() ? 'var(--color-give)' : 'var(--color-border)',
            color: 'white', cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', flexShrink: 0, transition: 'background 0.15s',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
