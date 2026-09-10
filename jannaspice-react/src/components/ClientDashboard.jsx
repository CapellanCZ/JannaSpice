import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { AppHeader, EmptyState, IconButton } from './ui/index.jsx';
import BookingSummaryCard from './client/BookingSummaryCard.jsx';
import ProfileMenu from './client/ProfileMenu.jsx';
import InvoiceModal from './modals/InvoiceModal.jsx';

export default function ClientDashboard() {
  const {
    currentUser, switchAppView, handleLogout, reservationsQueue, clientNotifications,
    markClientNotificationsRead, clearClientNotifications, openChat, openClientDetail,
    openProfileModal, openAuthModal
  } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const [invoiceRes, setInvoiceRes] = useState(null);

  if (!currentUser) {
    switchAppView('home');
    return null;
  }

  const myBookings = reservationsQueue.filter(r => r.userId === currentUser.id || r.email === currentUser.email);
  const myNotifs = clientNotifications.filter(n => n.userId === currentUser.id || n.email === currentUser.email);
  const unreadCount = myNotifs.filter(n => !n.read).length;

  function toggleNotifs() {
    setNotifOpen(o => !o);
    if (!notifOpen) markClientNotificationsRead();
  }

  function startNewBooking() {
    switchAppView('booking');
    window.dispatchEvent(new CustomEvent('start-booking', { detail: { presetPackageId: null } }));
  }

  function requestChanges(resId) {
    switchAppView('booking');
    window.dispatchEvent(new CustomEvent('edit-reservation', { detail: { resId } }));
  }

  return (
    <div className="bg-sand-50 flex flex-col min-h-[100dvh]">
      <AppHeader icon="fa-utensils" title="JannaSpice" subtitle="Client portal" onBrandClick={() => switchAppView('client-dashboard')}>
        <ProfileMenu
          user={currentUser}
          onSeeProfile={openProfileModal}
          onChangePassword={() => openAuthModal('recovery')}
          onSignOut={handleLogout}
        />
        <div className="relative">
          <IconButton onClick={toggleNotifs} label="Notifications" icon="fa-bell" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-spice-500 text-white w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-soft border border-sand-200 z-50 p-4 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-3 border-b border-sand-200 pb-2">
                <span className="font-bold text-sm text-spice-900">Notifications</span>
                <button type="button" onClick={() => clearClientNotifications()} className="text-xs font-semibold text-spice-500 hover:underline">Clear</button>
              </div>
              <div className="space-y-2">
                {myNotifs.length === 0 ? (
                  <p className="text-xs text-spice-900/50 text-center py-4">No notifications yet.</p>
                ) : myNotifs.map(n => (
                  <div key={n.id} className={`p-3 rounded-xl border text-xs space-y-1 ${n.read ? 'bg-sand-50' : 'bg-spice-50 border-spice-200'}`}>
                    <p className="font-semibold text-spice-900">{n.text}</p>
                    <span className="text-[10px] text-spice-900/50">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AppHeader>

      <main className="flex-1 p-4 lg:p-8 max-w-3xl mx-auto w-full space-y-5">
        <div className="flex justify-between items-end pb-1">
          <div>
            <h2 className="text-[28px] font-serif font-bold text-spice-900 tracking-tight">Your Reservation Bookings</h2>
            <p className="text-sm text-spice-900/40 mt-1">
              {myBookings.length === 0
                ? 'You have no bookings yet'
                : `You have ${myBookings.length} booking${myBookings.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button type="button" onClick={startNewBooking} className="btn-primary btn-sm">
            <i className="fa-solid fa-plus"></i> New booking
          </button>
        </div>

        <div className="space-y-3">
          {myBookings.length === 0 ? (
            <div className="bg-white rounded-[20px] border border-sand-200/80">
              <EmptyState
                icon="fa-regular fa-calendar-xmark"
                title="No bookings yet"
                body="Start a reservation to lock a date with JannaSpice."
                action={<button type="button" onClick={startNewBooking} className="btn-primary">Book an event</button>}
              />
            </div>
          ) : myBookings.map((r) => (
            <BookingSummaryCard
              key={r.id}
              reservation={r}
              onDetails={() => openClientDetail(r.id)}
              onMessages={() => openChat(r.id, 'client')}
              onRequestChanges={() => requestChanges(r.id)}
              onViewInvoice={setInvoiceRes}
            />
          ))}
        </div>
      </main>

      <InvoiceModal open={!!invoiceRes} reservation={invoiceRes} onClose={() => setInvoiceRes(null)} />
    </div>
  );
}
