import { useEffect, useRef, useState } from 'react';

export default function ProfileMenu({ user, onSeeProfile, onChangePassword, onSignOut }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const displayName = user?.name || 'Account';
  const email = user?.email || '';

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function run(action) {
    setOpen(false);
    action?.();
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="icon-btn"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        title={displayName}
      >
        <i className="fa-regular fa-user"></i>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 z-50 w-60 bg-white rounded-2xl border border-sand-200 shadow-soft overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-sand-100">
            <p className="text-sm font-semibold text-spice-900 truncate">{displayName}</p>
            {email ? <p className="text-[11px] text-spice-900/45 truncate mt-0.5">{email}</p> : null}
          </div>

          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-spice-900 hover:bg-sand-50 flex items-center gap-2.5"
              onClick={() => run(onSeeProfile)}
            >
              <i className="fa-regular fa-user text-spice-400 w-4 text-center"></i>
              See profile
            </button>
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-spice-900 hover:bg-sand-50 flex items-center gap-2.5"
              onClick={() => run(onChangePassword)}
            >
              <i className="fa-solid fa-key text-spice-400 w-4 text-center"></i>
              Change password
            </button>
            <div className="my-1 border-t border-sand-100" />
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5"
              onClick={() => run(onSignOut)}
            >
              <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center"></i>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
