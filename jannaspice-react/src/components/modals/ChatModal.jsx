import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export default function ChatModal() {
  const { chatModal, closeChat, reservationsQueue, sendMessage, view } = useApp();
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
    <div className="fixed inset-0 bg-spice-900/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
      <div className="bg-sand-50 rounded-3xl shadow-soft w-full max-w-md h-[600px] max-h-[90vh] flex flex-col relative">
        <header className="bg-white p-4 border-b border-sand-200 rounded-t-3xl flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-spice-100 text-spice-600 flex items-center justify-center font-bold shadow-sm"><i className="fa-solid fa-user-tie"></i></div>
            <div>
              <h3 className="font-bold text-spice-900 leading-tight">Messages</h3>
              <p className="text-xs text-spice-900/60">#RES-{res.id} • {res.eventTitle}</p>
            </div>
          </div>
          <button onClick={closeChat} className="w-8 h-8 rounded-full bg-sand-100 text-spice-900/60 hover:text-spice-900 hover:bg-sand-200 flex items-center justify-center transition-colors"><i className="fa-solid fa-xmark"></i></button>
        </header>
        <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-4 flex flex-col">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-spice-900/40 p-6 m-auto">
              <div className="w-16 h-16 rounded-full bg-sand-200 flex items-center justify-center text-2xl mb-4"><i className="fa-regular fa-comments"></i></div>
              <p className="text-sm font-bold text-spice-900 mb-1">No messages yet</p>
              <p className="text-xs">Send a message below to start the conversation.</p>
            </div>
          ) : messages.map((m, idx) => {
            const isMe = m.sender === chatModal.role;
            const senderName = m.sender === 'client' ? (res.name || 'Client').split(' ')[0] : 'JannaSpice Mgr';
            return (
              <div key={idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-spice-900/40 mb-1 font-medium px-1">{senderName} • {m.timestamp}</span>
                  <div className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${isMe ? 'bg-spice-500 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl shadow-md' : 'bg-white border border-sand-200 text-spice-900 rounded-tr-2xl rounded-tl-2xl rounded-br-2xl shadow-sm'}`}>{m.text}</div>
                </div>
              </div>
            );
          })}
        </div>
        <footer className="bg-white p-4 border-t border-sand-200 rounded-b-3xl shrink-0">
          <form onSubmit={submit} className="flex items-center gap-2">
            <input type="text" value={text} onChange={e => setText(e.target.value)} className="input-modern !py-2.5 flex-grow" placeholder="Type your message..." autoComplete="off" />
            <button type="submit" className="bg-spice-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-sm hover:bg-spice-600 transition-colors"><i className="fa-solid fa-paper-plane text-sm -ml-0.5"></i></button>
          </form>
        </footer>
      </div>
    </div>
  );
}
