import { useEffect, useRef, useState } from 'react';
import { printReceipt } from '../../utils/printReceipt.js';

export default function InvoiceDropdown({ reservation, onView }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

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

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-secondary btn-sm"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <i className="fa-solid fa-file-lines"></i>
        Invoice
        <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${open ? 'rotate-180' : ''}`}></i>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 bottom-full mb-2 z-50 w-52 bg-white rounded-2xl border border-sand-200 shadow-soft p-1.5"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-spice-900 hover:bg-sand-50 flex items-center gap-2"
            onClick={() => {
              setOpen(false);
              onView?.(reservation);
            }}
          >
            <i className="fa-solid fa-eye text-spice-400 w-4 text-center"></i>
            View invoice PDF
          </button>
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-spice-900 hover:bg-sand-50 flex items-center gap-2"
            onClick={() => {
              setOpen(false);
              printReceipt(reservation);
            }}
          >
            <i className="fa-solid fa-print text-spice-400 w-4 text-center"></i>
            Print / Save PDF
          </button>
        </div>
      )}
    </div>
  );
}
