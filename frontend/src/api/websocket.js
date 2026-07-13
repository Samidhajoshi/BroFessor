import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api')
  .replace('/api', '') + '/ws';

let client = null;
let connectPromise = null;

/**
 * Connect to the STOMP broker.
 * Returns a promise that resolves when the connection is established.
 * Safe to call multiple times — reuses the existing connection.
 */
export function connect(token) {
  if (client?.connected) return Promise.resolve(client);
  if (connectPromise) return connectPromise;

  connectPromise = new Promise((resolve, reject) => {
    client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('[WS] Connected');
        resolve(client);
      },
      onStompError: (frame) => {
        console.error('[WS] STOMP error', frame);
        connectPromise = null;
        reject(new Error(frame.headers?.message || 'STOMP error'));
      },
      onDisconnect: () => {
        console.log('[WS] Disconnected');
        connectPromise = null;
      },
    });
    client.activate();
  });

  return connectPromise;
}

export function disconnect() {
  client?.deactivate();
  client = null;
  connectPromise = null;
}

export function getClient() { return client; }

/** Subscribe to a STOMP destination. Returns an unsubscribe function. */
export function subscribe(destination, callback) {
  if (!client?.connected) {
    console.warn('[WS] subscribe called before connect:', destination);
    return () => {};
  }
  const sub = client.subscribe(destination, (msg) => {
    try { callback(JSON.parse(msg.body)); }
    catch (e) { console.error('[WS] parse error', e); }
  });
  return () => sub.unsubscribe();
}

/** Publish a message to a STOMP destination. */
export function publish(destination, body) {
  if (!client?.connected) {
    console.warn('[WS] publish called before connect:', destination);
    return;
  }
  client.publish({ destination, body: JSON.stringify(body) });
}
