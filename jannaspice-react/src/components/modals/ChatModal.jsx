import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { EmptyState, IconButton, ModalShell } from '../ui/index.jsx';

export default function ChatModal() {
  const { chatModal, closeChat, reservationsQueue, sendMessage } = useApp();
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  const res = chatModal.open ? reservationsQueue.find(r => r.id === chatModal.resId) : null;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [res?.messages?.length, chatModal.open]);

  if (!chatModal.open || !res) return null;

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(res.id, chatModal.role, text.trim());
    setText('');
  }

  const messages = res.messages || [];

  return (
    <ModalShell open onClose={closeChat} labelledBy="chat-title" flush className="h-[min(600px,90vh)] bg-sand-50">
      <header className="bg-white p-4 border-b border-sand-200 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-spice-100 text-spice-600 flex items-center justify-center shrink-0"><i className="fa-solid fa-user-tie"></i></div>
          <div className="min-w-0">
            <h3 id="chat-title" className="font-semibold text-spice-900 leading-tight">Messages</h3>
            <p className="text-xs text-spice-900/60 truncate">#RES-{res.id} · {res.eventTitle}</p>
          </div>
        </div>
        <IconButton onClick={closeChat} label="Close" />
      </header>
      <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-4 flex flex-col">
        {messages.length === 0 ? (
          <EmptyState icon="fa-regular fa-comments" title="No messages yet" body="Send a message below to start the conversation." />
        ) : messages.map((m, idx) => {
          const isMe = m.sender === chatModal.role;
          const senderName = m.sender === 'client' ? (res.name || 'Client').split(' ')[0] : 'JannaSpice Mgr';
          return (
            <div key={idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-spice-900/40 mb-1 font-medium px-1">{senderName} · {m.timestamp}</span>
                <div className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${isMe ? 'bg-spice-500 text-white rounded-2xl rounded-br-md shadow-sm' : 'bg-white border border-sand-200 text-spice-900 rounded-2xl rounded-bl-md shadow-sm'}`}>{m.text}</div>
              </div>
            </div>
          );
        })}
      </div>
      <footer className="bg-white p-4 border-t border-sand-200 shrink-0">
        <form onSubmit={submit} className="flex items-center gap-2">
          <input type="text" value={text} onChange={e => setText(e.target.value)} className="input-modern !py-2.5 flex-grow" placeholder="Type your message..." autoComplete="off" />
          <button type="submit" className="bg-spice-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-spice-600 transition-colors shrink-0" aria-label="Send"><i className="fa-solid fa-paper-plane text-sm"></i></button>
        </form>
      </footer>
    </ModalShell>
  );
}
