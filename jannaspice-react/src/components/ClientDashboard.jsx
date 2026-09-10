import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { AppHeader, Banner, EmptyState, IconButton, StatusBadge } from './ui/index.jsx';

export default function ClientDashboard() {
  const { currentUser, switchAppView, handleLogout, reservationsQueue, clientNotifications,
          markClientNotificationsRead, clearClientNotifications, openChat, openClientDetail, openProfileModal } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);

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
      <AppHeader icon="fa-utensils" title="My bookings" subtitle="Client portal" onBrandClick={() => switchAppView('home')}>
        <button type="button" onClick={openProfileModal} className="btn-ghost btn-sm hidden sm:inline-flex">Profile</button>
        <button type="button" onClick={handleLogout} className="btn-ghost btn-sm hidden sm:inline-flex">Sign out</button>
        <div className="relative">
          <IconButton onClick={toggleNotifs} label="Notifications" icon="fa-bell" />
          {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-spice-500 text-white w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>}
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

      <main className="flex-1 p-4 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex justify-between items-end border-b border-sand-200 pb-4">
          <h2 className="text-2xl font-serif font-bold text-spice-900">Reservations</h2>
          <button type="button" onClick={startNewBooking} className="btn-primary btn-sm"><i className="fa-solid fa-plus"></i> New booking</button>
        </div>

        <div className="space-y-4">
          {myBookings.length === 0 ? (
            <div className="surface-card">
              <EmptyState
                icon="fa-regular fa-calendar-xmark"
                title="No bookings yet"
                body="Start a reservation to lock a date with JannaSpice."
                action={<button type="button" onClick={startNewBooking} className="btn-primary">Book an event</button>}
              />
            </div>
          ) : myBookings.map(r => {
            const msgCount = r.messages ? r.messages.length : 0;
            return (
              <div key={r.id} className="surface-card p-5 lg:p-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="font-serif font-bold text-spice-900 text-xl">{r.eventTitle}</h4>
                    <StatusBadge status={r.status} />
                    <span className="text-xs text-spice-900/50 bg-sand-100 px-2 py-1 rounded-full font-medium">#RES-{r.id}</span>
                    {r.changeRequest?.status === 'Pending' && <span className="status-badge badge-down">Change pending</span>}
                    {r.cancelRequest?.status === 'pending' && <span className="status-badge badge-cancelled">Cancel pending</span>}
                  </div>
                  <div className="flex flex-col gap-1.5 mt-3">
                    <p className="text-sm text-spice-900/70 flex items-center gap-2"><i className="fa-regular fa-calendar w-4 text-spice-400 text-center"></i> <strong className="text-spice-900">{r.date}</strong> at {r.startTime}</p>
                    <p className="text-sm text-spice-900/70 flex items-center gap-2"><i className="fa-solid fa-location-dot w-4 text-spice-400 text-center"></i> {r.venue}</p>
                    <p className="text-sm text-spice-900/70 flex items-center gap-2"><i className="fa-solid fa-bell-concierge w-4 text-spice-400 text-center"></i> {r.package?.name}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => openClientDetail(r.id)} className="btn-primary btn-sm">Details</button>
                    <button type="button" onClick={() => openChat(r.id, 'client')} className="btn-secondary btn-sm">
                      Messages
                      {msgCount > 0 && <span className="bg-spice-500 text-white rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center text-[10px] font-bold">{msgCount}</span>}
                    </button>
                    {r.status !== 'Cancelled' && (
                      <button type="button" onClick={() => requestChanges(r.id)} className="btn-secondary btn-sm">Request changes</button>
                    )}
                  </div>
                  {r.status === 'Approved' && r.paymentDueAt && !r.payments.fee && (
                    <div className="mt-3">
                      <Banner tone="info" icon="fa-clock">Fee due {new Date(r.paymentDueAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</Banner>
                    </div>
                  )}
                </div>
                <div className="text-left md:text-right w-full md:w-auto bg-sand-50 md:bg-transparent p-4 md:p-0 rounded-xl border border-sand-200 md:border-none">
                  <span className="block text-[10px] uppercase tracking-widest font-bold text-spice-900/50 mb-1">Total</span>
                  <span className="font-serif font-bold text-spice-500 text-3xl block">₱{r.package?.price.toLocaleString()}</span>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-spice-900/60">
                    <div className={r.payments.fee ? 'text-emerald-600 font-bold' : ''}>Fee<br />{r.payments.fee ? <i className="fa-solid fa-check"></i> : '20%'}</div>
                    <div className={r.payments.down ? 'text-emerald-600 font-bold' : ''}>Down<br />{r.payments.down ? <i className="fa-solid fa-check"></i> : '30%'}</div>
                    <div className={r.payments.bal ? 'text-emerald-600 font-bold' : ''}>Bal<br />{r.payments.bal ? <i className="fa-solid fa-check"></i> : '50%'}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
