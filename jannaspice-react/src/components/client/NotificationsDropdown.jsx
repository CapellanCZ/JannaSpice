import { useEffect, useRef } from 'react';

function notifIcon(text = '') {
  const t = text.toLowerCase();
  if (t.includes('payment') || t.includes('paid') || t.includes('fee')) return 'fa-receipt';
  if (t.includes('approved') || t.includes('reserved')) return 'fa-circle-check';
  if (t.includes('cancel')) return 'fa-ban';
  if (t.includes('submitted') || t.includes('pending')) return 'fa-paper-plane';
  if (t.includes('message')) return 'fa-comment';
  return 'fa-bell';
}

export default function NotificationsDropdown({
  open,
  onClose,
  notifications,
  onClear
}) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) onClose?.();
    }
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={rootRef}
      className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-soft border border-sand-200 z-50 overflow-hidden"
      role="dialog"
      aria-label="Notifications"
    >
      <div className="flex justify-between items-center px-4 py-3 border-b border-sand-100">
        <div>
          <p className="font-bold text-sm text-spice-900">Notifications</p>
          <p className="text-[11px] text-spice-900/40 mt-0.5">
            {notifications.length === 0
              ? 'You’re all caught up'
              : `${notifications.length} update${notifications.length === 1 ? '' : 's'}`}
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-spice-500 hover:text-spice-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="p-2 max-h-96 overflow-y-auto space-y-1.5">
        {notifications.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-10 h-10 mx-auto rounded-full bg-sand-100 text-spice-900/35 flex items-center justify-center mb-3">
              <i className="fa-regular fa-bell"></i>
            </div>
            <p className="text-sm font-medium text-spice-900">No notifications yet</p>
            <p className="text-xs text-spice-900/45 mt-1">Booking updates will show up here in real time.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex gap-3 p-3 rounded-xl border text-left ${
                n.read ? 'bg-white border-sand-100' : 'bg-spice-50/80 border-spice-100'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                n.read ? 'bg-sand-100 text-spice-900/40' : 'bg-white text-spice-500 shadow-sm'
              }`}>
                <i className={`fa-solid ${notifIcon(n.text)} text-xs`}></i>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs font-semibold text-spice-900 leading-snug">{n.text}</p>
                <span className="text-[10px] text-spice-900/45">{n.time}</span>
              </div>
              {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-spice-500 mt-1.5 shrink-0" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
