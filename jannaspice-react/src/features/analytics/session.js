import { touchSession } from './api.js';

const SESSION_KEY = 'js_session_id';

export function getSessionId() {
  let id = null;
  try {
    id = localStorage.getItem(SESSION_KEY);
  } catch {
    // Private browsing / storage disabled -- fall through to an in-memory id.
  }
  if (!id) {
    id = crypto.randomUUID();
    try {
      localStorage.setItem(SESSION_KEY, id);
    } catch {
      // Nothing more we can do -- this id just won't persist across reloads.
    }
  }
  return id;
}

// Records first-touch attribution (?source=, ?ref=) for this session. Safe to call on
// every app load: touch_session never overwrites a session's first_source/first_referral_code
// once set, so re-running this with different query params later doesn't corrupt attribution.
export async function bootstrapSession() {
  const sessionId = getSessionId();
  try {
    const params = new URLSearchParams(window.location.search);
    await touchSession(sessionId, params.get('source'), params.get('ref'));
  } catch {
    // Analytics must never block the app from loading.
  }
  return sessionId;
}
