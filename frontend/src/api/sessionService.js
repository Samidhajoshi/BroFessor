import axiosClient from './axiosClient';

export const sessionService = {
  // ── Read ─────────────────────────────────────────────────────────────
  mySessions: ()   => axiosClient.get('/sessions').then(r => r.data),
  getById:    (id) => axiosClient.get(`/sessions/${id}`).then(r => r.data),

  // ── Scheduling ───────────────────────────────────────────────────────
  /**
   * Create a session from an accepted skill request.
   * @param {Object} payload  { sessionRequestId, scheduledTime, meetingLink }
   */
  create: (payload) => axiosClient.post('/sessions', payload).then(r => r.data),

  /**
   * Update scheduled time or meeting link (host only).
   * @param {number} id
   * @param {Object} payload  { scheduledTime?, meetingLink? }
   */
  update: (id, payload) => axiosClient.put(`/sessions/${id}`, payload).then(r => r.data),

  /** Cancel a session (either participant). */
  cancel: (id) => axiosClient.patch(`/sessions/${id}/cancel`).then(r => r.data),

  /** Delete a cancelled session (host only). */
  delete: (id) => axiosClient.delete(`/sessions/${id}`).then(r => r.data),

  // ── Lifecycle ────────────────────────────────────────────────────────
  complete: (id) => axiosClient.post(`/sessions/${id}/complete`).then(r => r.data),
  rate: (id, rating, review) =>
    axiosClient.post(`/sessions/${id}/rate`, { rating, review }).then(r => r.data),

  // ── Validation helper (client-side mirror) ───────────────────────────
  detectProvider(url) {
    if (!url) return null;
    const t = url.trim();
    if (/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/i.test(t)) return 'GOOGLE_MEET';
    if (/^https:\/\/([a-z0-9-]+\.)?zoom\.us\/(j|my)\/[a-zA-Z0-9?=&%_-]+$/i.test(t)) return 'ZOOM';
    if (/^https:\/\/teams\.microsoft\.com\/l\/meetup-join\/.+$/i.test(t)) return 'MICROSOFT_TEAMS';
    if (/^https:\/\/meet\.jit\.si\/[^\s/]+$/i.test(t)) return 'JITSI';
    return null;
  },

  isValidMeetingLink(url) {
    return this.detectProvider(url) !== null;
  },
};

/** Human-readable label + emoji for each provider. */
export const PROVIDER_META = {
  GOOGLE_MEET:    { label: 'Google Meet',      emoji: '🟢', color: '#34a853' },
  ZOOM:           { label: 'Zoom',             emoji: '🔵', color: '#2d8cff' },
  MICROSOFT_TEAMS:{ label: 'Microsoft Teams',  emoji: '🟣', color: '#6264a7' },
  JITSI:          { label: 'Jitsi',            emoji: '🟠', color: '#f47920' },
};
