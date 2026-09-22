import { useApp } from '../../context/AppContext.jsx';
import { ModalShell } from '../ui/index.jsx';

export default function SuccessModal() {
  const { successModal, closeSuccessModal, switchAppView } = useApp();
  if (!successModal.open) return null;

  function close() {
    closeSuccessModal();
    switchAppView('client-dashboard');
  }

  return (
    <ModalShell open onClose={close} labelledBy="success-title" closeOnOverlay={false}>
      <div className="h-1.5 bg-spice-500 rounded-t-2xl"></div>
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">
          <i className="fa-solid fa-check"></i>
        </div>
        <h3 id="success-title" className="text-2xl font-serif font-bold text-spice-900 mb-3">Request sent</h3>
        <p className="text-spice-900/70 mb-8 text-sm" dangerouslySetInnerHTML={{ __html: successModal.message }}></p>
        <button type="button" onClick={close} className="w-full btn-secondary">Return to my bookings</button>
      </div>
    </ModalShell>
  );
}
