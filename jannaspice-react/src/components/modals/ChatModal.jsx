import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { IconButton, ModalShell } from '../ui/index.jsx';

function dayLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
}

function buildThread(messages) {
  const items = [];
  let lastDay = null;
  for (const m of messages) {
    const day = dayLabel(m.createdAt);
    if (day && day !== lastDay) {
      items.push({ type: 'day', id: `day-${day}-${m.id}`, label: day });
      lastDay = day;
    }
    items.push({ type: 'msg', ...m });
  }
  return items;
}

export default function ChatModal() {
  const { chatModal, closeChat, reservationsQueue, sendMessage, currentUser, markReservationChatRead } = useApp();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState([]);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  const res = chatModal.open ? reservationsQueue.find((r) => r.id === chatModal.resId) : null;
  const role = chatModal.role;
  const serverMessages = res?.messages || [];
  const serverMsgSig = serverMessages.map((m) => m.id).join('|');

  const messages = useMemo(() => {
    const ids = new Set(serverMessages.map((m) => m.id));
    const extras = pending.filter((p) => !ids.has(p.id) && p.text);
    return [...serverMessages, ...extras];
  }, [serverMessages, pending]);

  const thread = useMemo(() => buildThread(messages), [messages]);

  useEffect(() => {
    if (!chatModal.open) {
      setText('');
      setPending([]);
      setSending(false);
    }
  }, [chatModal.open, chatModal.resId]);

  useEffect(() => {
    if (!chatModal.open || !res) return;
    markReservationChatRead(res.id, serverMessages);
  }, [chatModal.open, res?.id, serverMsgSig, markReservationChatRead]);

  useEffect(() => {
    if (!chatModal.open) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, chatModal.open, sending]);

  if (!chatModal.open || !res) return null;

  const peerName = role === 'client'
    ? 'JannaSpice'
    : (res.name || 'Client').split(' ')[0];
  const myLabel = role === 'client'
    ? (currentUser?.name || res.name || 'You').split(' ')[0]
    : 'You';

  async function submit(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setText('');
    await deliver(body);
  }

  async function deliver(body, existingTempId = null) {
    const tempId = existingTempId || `temp-${Date.now()}`;

    if (!existingTempId) {
      setPending((list) => [
        ...list,
        {
          id: tempId,
          sender: role,
          text: body,
          timestamp: 'Sending…',
          createdAt: new Date().toISOString(),
          pending: true
        }
      ]);
    } else {
      setPending((list) =>
        list.map((m) =>
          m.id === tempId
            ? { ...m, pending: true, failed: false, timestamp: 'Sending…' }
            : m
        )
      );
    }

    setSending(true);
    const result = await sendMessage(res.id, role, body);
    setSending(false);

    if (result?.ok) {
      // Real message arrives via refresh; drop this optimistic row.
      setPending((list) => list.filter((m) => m.id !== tempId));
      return;
    }

    setPending((list) =>
      list.map((m) =>
        m.id === tempId
          ? { ...m, pending: false, failed: true, timestamp: 'Not sent' }
          : m
      )
    );
  }

  return (
    <ModalShell
      open
      onClose={closeChat}
      labelledBy="chat-title"
      flush
      size="lg"
      className="!h-[min(680px,92dvh)] bg-sand-50"
    >
      <header className="bg-white px-4 py-3.5 border-b border-sand-200 flex justify-between items-center shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full bg-spice-100 text-spice-600 flex items-center justify-center">
              <i className={`fa-solid ${role === 'client' ? 'fa-utensils' : 'fa-user'}`}></i>
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" title="Live" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 id="chat-title" className="font-semibold text-spice-900 leading-tight truncate">
                {peerName}
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-spice-900/50 truncate mt-0.5">
              #RES-{res.id} · {res.eventTitle}
            </p>
          </div>
        </div>
        <IconButton onClick={closeChat} label="Close" />
      </header>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center px-6">
            <div className="w-14 h-14 rounded-full bg-white border border-sand-200 text-spice-900/25 flex items-center justify-center mb-4 shadow-sm">
              <i className="fa-regular fa-comments text-2xl"></i>
            </div>
            <h4 className="font-serif font-bold text-lg text-spice-900">No messages yet</h4>
            <p className="text-sm text-spice-900/50 mt-1 max-w-xs">
              Say hello below — replies show up here in real time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {thread.map((item) => {
              if (item.type === 'day') {
                return (
                  <div key={item.id} className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-sand-200" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-spice-900/35">
                      {item.label}
                    </span>
                    <div className="h-px flex-1 bg-sand-200" />
                  </div>
                );
              }

              const isMe = item.sender === role;
              const senderName = isMe ? myLabel : peerName;
              return (
                <div key={item.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs ${
                      isMe ? 'bg-spice-500 text-white' : 'bg-white border border-sand-200 text-spice-500'
                    }`}
                  >
                    <i className={`fa-solid ${isMe ? 'fa-user' : role === 'client' ? 'fa-utensils' : 'fa-user'}`}></i>
                  </div>
                  <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-spice-900/40 mb-1 font-medium px-1">
                      {senderName}
                      {item.timestamp ? ` · ${item.timestamp}` : ''}
                    </span>
                    <div
                      className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        item.failed
                          ? 'bg-red-50 text-red-700 border border-red-200 rounded-2xl'
                          : isMe
                            ? 'bg-spice-500 text-white rounded-2xl rounded-br-md shadow-sm'
                            : 'bg-white border border-sand-200 text-spice-900 rounded-2xl rounded-bl-md shadow-sm'
                      } ${item.pending ? 'opacity-70' : ''}`}
                    >
                      {item.text}
                    </div>
                    {item.failed && (
                      <button
                        type="button"
                        className="text-[10px] font-semibold text-spice-500 mt-1 px-1 hover:underline"
                        onClick={() => deliver(item.text, item.id)}
                        disabled={sending}
                      >
                        Tap to retry
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <footer className="bg-white p-3 sm:p-4 border-t border-sand-200 shrink-0">
        <form onSubmit={submit} className="flex items-end gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="input-modern !py-2.5 flex-grow"
            placeholder={`Message ${peerName}…`}
            autoComplete="off"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="bg-spice-500 text-white w-11 h-11 rounded-full flex items-center justify-center hover:bg-spice-600 transition-colors shrink-0 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Send"
          >
            <i className={`fa-solid ${sending ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'} text-sm`}></i>
          </button>
        </form>
        <p className="text-[10px] text-spice-900/35 mt-2 px-1">
          Messages sync instantly for you and {peerName}.
        </p>
      </footer>
    </ModalShell>
  );
}
