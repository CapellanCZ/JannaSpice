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
import ToastHost from './components/ui/ToastHost.jsx';
import { BrandMark } from './components/ui/index.jsx';

export default function App() {
  const { view, authReady } = useApp();

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
      <ToastHost />
      <div id="print-receipt-container"></div>
    </>
  );
}
