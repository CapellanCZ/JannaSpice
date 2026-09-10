import { useApp } from '../../context/AppContext.jsx';

export default function SuccessModal() {
  const { successModal, closeSuccessModal, switchAppView } = useApp();
  if (!successModal.open) return null;

  function close() {
    closeSuccessModal();
    switchAppView('client-dashboard');
  }

  return (
    <div className="fixed inset-0 bg-spice-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-soft p-10 max-w-md w-full text-center relative overflow-hidden">
        <div className="w-full h-3 bg-spice-500 absolute top-0 left-0"></div>
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"><i className="fa-solid fa-check"></i></div>
        <h3 className="text-3xl font-serif font-bold text-spice-900 mb-3">Request Sent!</h3>
        <p className="text-spice-900/70 mb-8 text-sm" dangerouslySetInnerHTML={{ __html: successModal.message }}></p>
        <button onClick={close} className="w-full btn-secondary">Return to My Bookings</button>
      </div>
    </div>
  );
}
