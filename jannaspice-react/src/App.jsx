import { useApp } from './context/AppContext.jsx';
import Home from './components/Home.jsx';
import BookingWizard from './components/BookingWizard.jsx';
import ClientDashboard from './components/ClientDashboard.jsx';
import ManagerDashboard from './components/ManagerDashboard.jsx';

import AuthModal from './components/modals/AuthModal.jsx';
import ChatModal from './components/modals/ChatModal.jsx';
import DetailPanel from './components/modals/DetailPanel.jsx';
import ClientDetailModal from './components/modals/ClientDetailModal.jsx';
import SuccessModal from './components/modals/SuccessModal.jsx';
import BlackoutModal from './components/modals/BlackoutModal.jsx';
import CustomAlertModal from './components/modals/CustomAlertModal.jsx';

export default function App() {
  const { view, switchAppView, currentUser, authReady } = useApp();
  const isManager = currentUser?.role === 'manager';

  if (!authReady) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center text-spice-900/60 text-sm font-medium">
        Loading JannaSpice…
      </div>
    );
  }

  return (
    <>
      {view !== 'manager' && isManager && (
        <button
          onClick={() => switchAppView('manager')}
          className="fixed bottom-6 right-6 z-[60] bg-spice-900 text-white px-5 py-3 rounded-full text-sm font-medium shadow-float hover:bg-spice-500 transition-colors duration-300 flex items-center gap-2 active:scale-95"
          aria-label="Switch to Manager View"
        >
          <i className="fa-solid fa-clipboard-list"></i> Manager View
        </button>
      )}

      {view === 'home' && <Home />}
      {view === 'booking' && <BookingWizard />}
      {view === 'client-dashboard' && <ClientDashboard />}
      {view === 'manager' && <ManagerDashboard />}

      <AuthModal />
      <ChatModal />
      <DetailPanel />
      <ClientDetailModal />
      <SuccessModal />
      <BlackoutModal />
      <CustomAlertModal />
      <div id="print-receipt-container"></div>
    </>
  );
}
