import { useApp } from '../../context/AppContext.jsx';
import { IconButton, ModalShell } from '../ui/index.jsx';

const ICONS = {
  error: { wrap: 'bg-red-50 text-red-600', icon: 'fa-solid fa-triangle-exclamation' },
  success: { wrap: 'bg-emerald-50 text-emerald-600', icon: 'fa-solid fa-check' },
  confirm: { wrap: 'bg-amber-50 text-amber-700', icon: 'fa-regular fa-circle-question' },
  info: { wrap: 'bg-spice-50 text-spice-500', icon: 'fa-solid fa-circle-info' }
};

export default function CustomAlertModal() {
  const { alertModal, closeCustomAlert } = useApp();
  if (!alertModal.open) return null;

  const cfg = ICONS[alertModal.type] || ICONS.info;

  return (
    <ModalShell open onClose={() => closeCustomAlert(false)} size="sm" labelledBy="alert-title" layer="alert">
      <IconButton onClick={() => closeCustomAlert(false)} label="Close" className="dialog-close" />
      <div className="p-8 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 ${cfg.wrap}`}><i className={cfg.icon}></i></div>
        <h3 id="alert-title" className="font-serif font-bold text-xl text-spice-900 mb-2">{alertModal.title}</h3>
        <p className="text-spice-900/70 mb-6 text-sm">{alertModal.message}</p>
        <div className="flex gap-3 justify-center">
          {alertModal.type === 'confirm' ? (
            <>
              <button type="button" onClick={() => closeCustomAlert(false)} className="btn-secondary w-full">No, go back</button>
              <button
                type="button"
                onClick={() => closeCustomAlert(true)}
                className={`${alertModal.confirmDanger ? 'btn-danger' : 'btn-primary'} w-full`}
              >
                {alertModal.confirmLabel || 'Yes, I’m sure'}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => closeCustomAlert(true)} className="btn-primary w-full">OK</button>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
