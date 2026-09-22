import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { isChatImage } from '../../features/bookings/index.js';
import { IconButton, ModalShell } from '../ui/index.jsx';

const ACCEPT =
  'image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

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

function formatBytes(n) {
  const size = Number(n) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentBubble({ message, isMe, getChatAttachmentUrl }) {
  const [url, setUrl] = useState(message.previewUrl || null);
  const [loading, setLoading] = useState(false);
  const isImage = isChatImage(message.attachmentMime) || (message.file && message.file.type?.startsWith('image/'));

  useEffect(() => {
    if (message.previewUrl) {
      setUrl(message.previewUrl);
      return undefined;
    }
    if (!message.attachmentPath) return undefined;
    let cancelled = false;
    setLoading(true);
    getChatAttachmentUrl(message.attachmentPath)
      .then((signed) => {
        if (!cancelled) setUrl(signed);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [message.attachmentPath, message.previewUrl, getChatAttachmentUrl]);

  if (isImage) {
    return (
      <div className={`overflow-hidden rounded-xl ${isMe ? 'bg-spice-600/30' : 'bg-sand-50'} border ${isMe ? 'border-white/20' : 'border-sand-200'}`}>
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="block">
            <img src={url} alt={message.attachmentName || 'Attachment'} className="max-h-56 w-full object-cover" />
          </a>
        ) : (
          <div className={`h-36 flex items-center justify-center text-xs ${isMe ? 'text-white/70' : 'text-spice-900/45'}`}>
            {loading ? 'Loading image…' : 'Image unavailable'}
          </div>
        )}
        {message.attachmentName ? (
          <p className={`px-2.5 py-1.5 text-[11px] truncate ${isMe ? 'text-white/75' : 'text-spice-900/55'}`}>
            {message.attachmentName}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <a
      href={url || undefined}
      target={url ? '_blank' : undefined}
      rel={url ? 'noreferrer' : undefined}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 border ${
        isMe
          ? 'bg-spice-600/25 border-white/20 text-white hover:bg-spice-600/40'
          : 'bg-sand-50 border-sand-200 text-spice-900 hover:bg-sand-100'
      } ${!url ? 'pointer-events-none opacity-70' : ''}`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-white/15' : 'bg-white border border-sand-200'}`}>
        <i className={`fa-solid fa-file-lines ${isMe ? 'text-white' : 'text-spice-500'}`}></i>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{message.attachmentName || 'Attachment'}</p>
        <p className={`text-[11px] ${isMe ? 'text-white/65' : 'text-spice-900/45'}`}>
          {loading ? 'Opening…' : formatBytes(message.attachmentSize)}
        </p>
      </div>
    </a>
  );
}

export default function ChatModal() {
  const {
    chatModal, closeChat, reservationsQueue, sendMessage, currentUser,
    markReservationChatRead, getChatAttachmentUrl, customAlert
  } = useApp();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState([]);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const res = chatModal.open ? reservationsQueue.find((r) => r.id === chatModal.resId) : null;
  const role = chatModal.role;
  const serverMessages = res?.messages || [];
  const serverMsgSig = serverMessages.map((m) => m.id).join('|');

  const messages = useMemo(() => {
    const ids = new Set(serverMessages.map((m) => m.id));
    const extras = pending.filter((p) => !ids.has(p.id) && (p.text || p.attachmentPath || p.previewUrl));
    return [...serverMessages, ...extras];
  }, [serverMessages, pending]);

  const thread = useMemo(() => buildThread(messages), [messages]);
  const canSend = Boolean(text.trim() || file) && !sending;

  useEffect(() => {
    if (!chatModal.open) {
      setText('');
      setFile(null);
      setPreviewUrl(null);
      setPending([]);
      setSending(false);
    }
  }, [chatModal.open, chatModal.resId]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }
    if (!file.type.startsWith('image/')) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

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

  function pickFile(e) {
    const next = e.target.files?.[0] || null;
    e.target.value = '';
    if (!next) return;
    if (next.size > 8 * 1024 * 1024) {
      customAlert('File must be 8 MB or smaller.', 'Too large', 'error');
      return;
    }
    setFile(next);
  }

  async function submit(e) {
    e.preventDefault();
    if (!canSend) return;
    const body = text.trim();
    const attach = file;
    setText('');
    setFile(null);
    await deliver(body, attach);
  }

  async function deliver(body, attach = null, existingTempId = null) {
    const tempId = existingTempId || `temp-${Date.now()}`;
    const localPreview = attach && attach.type?.startsWith('image/')
      ? URL.createObjectURL(attach)
      : null;

    if (!existingTempId) {
      setPending((list) => [
        ...list,
        {
          id: tempId,
          sender: role,
          text: body,
          timestamp: 'Sending…',
          createdAt: new Date().toISOString(),
          pending: true,
          attachmentName: attach?.name || null,
          attachmentMime: attach?.type || null,
          attachmentSize: attach?.size || null,
          previewUrl: localPreview,
          file: attach,
          _retryBody: body,
          _retryFile: attach
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
    const result = await sendMessage(res.id, role, body, attach);
    setSending(false);

    if (result?.ok) {
      setPending((list) => list.filter((m) => m.id !== tempId));
      if (localPreview) URL.revokeObjectURL(localPreview);
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
              Say hello below — you can also send photos or files.
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
              const hasAttachment = Boolean(item.attachmentPath || item.previewUrl || item.file);
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
                      className={`space-y-2 ${
                        item.text
                          ? `px-3.5 py-2.5 text-sm leading-relaxed ${
                              item.failed
                                ? 'bg-red-50 text-red-700 border border-red-200 rounded-2xl'
                                : isMe
                                  ? 'bg-spice-500 text-white rounded-2xl rounded-br-md shadow-sm'
                                  : 'bg-white border border-sand-200 text-spice-900 rounded-2xl rounded-bl-md shadow-sm'
                            }`
                          : ''
                      } ${item.pending ? 'opacity-70' : ''}`}
                    >
                      {hasAttachment ? (
                        <AttachmentBubble
                          message={item}
                          isMe={isMe}
                          getChatAttachmentUrl={getChatAttachmentUrl}
                        />
                      ) : null}
                      {item.text ? (
                        <p className="whitespace-pre-wrap break-words">{item.text}</p>
                      ) : null}
                    </div>
                    {item.failed && (
                      <button
                        type="button"
                        className="text-[10px] font-semibold text-spice-500 mt-1 px-1 hover:underline"
                        onClick={() => deliver(item._retryBody || item.text, item._retryFile || null, item.id)}
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
        {file ? (
          <div className="mb-2.5 flex items-center gap-2 rounded-xl border border-sand-200 bg-sand-50 px-2.5 py-2">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-white border border-sand-200 flex items-center justify-center text-spice-500 shrink-0">
                <i className="fa-solid fa-file-lines"></i>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-spice-900 truncate">{file.name}</p>
              <p className="text-[11px] text-spice-900/45">{formatBytes(file.size)}</p>
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label="Remove attachment"
              onClick={() => setFile(null)}
              disabled={sending}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        ) : null}

        <form onSubmit={submit} className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={pickFile}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="icon-btn shrink-0"
            aria-label="Attach photo or file"
            disabled={sending}
            title="Attach photo or file"
          >
            <i className="fa-solid fa-paperclip"></i>
          </button>
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
            disabled={!canSend}
            className="bg-spice-500 text-white w-11 h-11 rounded-full flex items-center justify-center hover:bg-spice-600 transition-colors shrink-0 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Send"
          >
            <i className={`fa-solid ${sending ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'} text-sm`}></i>
          </button>
        </form>
        <p className="text-[10px] text-spice-900/35 mt-2 px-1">
          Photos, PDF, or Word · up to 8 MB · syncs instantly with {peerName}.
        </p>
      </footer>
    </ModalShell>
  );
}
