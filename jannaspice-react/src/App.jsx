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
import ProfileModal from './components/modals/ProfileModal.jsx';
import CatalogModal from './components/modals/CatalogModal.jsx';
import { BrandMark } from './components/ui/index.jsx';

export default function App() {
  const { view, switchAppView, currentUser, authReady } = useApp();
  const isManager = currentUser?.role === 'manager';

  if (!authReady) {
    return (
      <div className="min-h-[100dvh] bg-sand-50 flex flex-col items-center justify-center gap-3">
        <BrandMark />
        <p className="text-sm font-medium text-spice-900/50">Loading JannaSpice</p>
      </div>
    );
  }

  return (
    <>
      {view !== 'manager' && isManager && (
        <button
          type="button"
          onClick={() => switchAppView('manager')}
          className="ui-fab bg-spice-900 text-white px-5 py-3 rounded-full text-sm font-semibold shadow-float hover:bg-spice-500 transition-colors duration-300 flex items-center gap-2 active:scale-95"
          aria-label="Switch to Manager View"
        >
          <i className="fa-solid fa-clipboard-list"></i> Manager view
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
      <ProfileModal />
      <CatalogModal />
      <CustomAlertModal />
      <div id="print-receipt-container"></div>
    </>
  );
}
