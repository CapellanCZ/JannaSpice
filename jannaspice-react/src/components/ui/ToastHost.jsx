import { useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';

const TONE = {
  info: { icon: 'fa-bell', bar: 'bg-spice-500', iconBg: 'bg-spice-50 text-spice-500' },
  success: { icon: 'fa-circle-check', bar: 'bg-emerald-500', iconBg: 'bg-emerald-50 text-emerald-600' },
  warning: { icon: 'fa-triangle-exclamation', bar: 'bg-amber-500', iconBg: 'bg-amber-50 text-amber-600' },
  error: { icon: 'fa-circle-exclamation', bar: 'bg-red-500', iconBg: 'bg-red-50 text-red-600' }
};

export default function ToastHost() {
  const { toasts, dismissToast } = useApp();

  if (!toasts?.length) return null;

  return (
    <div className="ui-toast-stack" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} dismissToast={dismissToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, dismissToast }) {
  const tone = TONE[toast.tone] || TONE.info;

  useEffect(() => {
    if (!toast.duration) return undefined;
    const timer = window.setTimeout(() => dismissToast(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.duration, dismissToast]);

  return (
    <div role="status" className="ui-toast">
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${tone.bar}`} />
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tone.iconBg}`}>
        <i className={`fa-solid ${tone.icon} text-sm`}></i>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-spice-900">{toast.title}</p>
        <p className="text-xs text-spice-900/60 mt-0.5 leading-relaxed line-clamp-3">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        className="icon-btn !w-8 !h-8 shrink-0"
        aria-label="Dismiss"
      >
        <i className="fa-solid fa-xmark text-xs"></i>
      </button>
    </div>
  );
}
