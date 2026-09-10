const storageKey = (resId) => `jannaspice-chat-seen-${resId}`;

export function getChatSeenAt(resId) {
  try {
    const raw = localStorage.getItem(storageKey(resId));
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function markChatSeen(resId, messages = []) {
  let latest = Date.now();
  for (const m of messages) {
    const t = m.createdAt ? new Date(m.createdAt).getTime() : 0;
    if (t > latest) latest = t;
  }
  try {
    localStorage.setItem(storageKey(resId), String(latest));
  } catch {
    // Ignore quota / private mode failures.
  }
}

/** Count messages from the other party that arrived after the user last opened the chat. */
export function countUnreadFromOther(resId, messages = [], myRole = 'client') {
  const other = myRole === 'manager' ? 'client' : 'manager';
  const seenAt = getChatSeenAt(resId);
  return messages.filter((m) => {
    if (m.sender !== other) return false;
    const t = m.createdAt ? new Date(m.createdAt).getTime() : 0;
    // Messages without timestamps still count if never seen this chat.
    if (!t) return seenAt === 0;
    return t > seenAt;
  }).length;
}
