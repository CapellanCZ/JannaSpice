import { useApp } from '../../context/AppContext.jsx';

const ICONS = {
  error: { wrap: 'bg-red-100 text-red-500', icon: 'fa-solid fa-triangle-exclamation' },
  success: { wrap: 'bg-green-100 text-green-500', icon: 'fa-solid fa-check' },
  confirm: { wrap: 'bg-orange-100 text-orange-500', icon: 'fa-regular fa-circle-question' },
  info: { wrap: 'bg-spice-100 text-spice-500', icon: 'fa-solid fa-circle-info' }
};

export default function CustomAlertModal() {
  const { alertModal, closeCustomAlert } = useApp();
  if (!alertModal.open) return null;

  const cfg = ICONS[alertModal.type] || ICONS.info;

  return (
    <div className="fixed inset-0 bg-spice-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-soft p-8 max-w-sm w-full text-center relative">
        <button onClick={() => closeCustomAlert(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-sand-100 text-spice-900/60 hover:text-spice-900 hover:bg-sand-200"><i className="fa-solid fa-xmark"></i></button>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 ${cfg.wrap}`}><i className={cfg.icon}></i></div>
        <h3 className="font-serif font-bold text-xl text-spice-900 mb-2">{alertModal.title}</h3>
        <p className="text-spice-900/70 mb-6 text-sm">{alertModal.message}</p>
        <div className="flex gap-3 justify-center">
          {alertModal.type === 'confirm' ? (
            <>
              <button onClick={() => closeCustomAlert(false)} className="btn-secondary w-full">Cancel</button>
              <button onClick={() => closeCustomAlert(true)} className="btn-primary w-full bg-red-500 hover:bg-red-600 border-none">Proceed</button>
            </>
          ) : alertModal.type === 'error' ? (
            <button onClick={() => closeCustomAlert(true)} className="btn-primary w-full bg-red-500 hover:bg-red-600 border-none">OK</button>
          ) : alertModal.type === 'success' ? (
            <button onClick={() => closeCustomAlert(true)} className="btn-primary w-full bg-green-500 hover:bg-green-600 border-none">OK</button>
          ) : (
            <button onClick={() => closeCustomAlert(true)} className="btn-primary w-full">OK</button>
          )}
        </div>
      </div>
    </div>
  );
}
