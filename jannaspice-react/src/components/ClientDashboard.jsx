import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

const BADGE = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-blue-100 text-blue-800',
  Reserved: 'bg-purple-100 text-purple-800',
  DownpaymentVerified: 'bg-orange-100 text-orange-800',
  FullyPaid: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-700'
};

export default function ClientDashboard() {
  const { currentUser, switchAppView, handleLogout, reservationsQueue, clientNotifications,
          markClientNotificationsRead, clearClientNotifications, openChat, openClientDetail } = useApp();
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
    <div className="bg-sand-50 flex flex-col min-h-screen">
      <header className="bg-white border-b border-sand-200 px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-spice-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md"><i className="fa-solid fa-utensils"></i></div>
          <div><h1 className="font-serif font-bold text-lg text-spice-900 leading-none">My Bookings</h1><p className="text-xs text-spice-900/50">Client Portal</p></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button onClick={toggleNotifs} className="w-10 h-10 rounded-full bg-sand-100 hover:bg-sand-200 text-spice-900 flex items-center justify-center relative transition-colors">
              <i className="fa-regular fa-bell"></i>
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-spice-500 text-white w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-soft border border-sand-200 z-50 p-4 max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center mb-3 border-b border-sand-200 pb-2">
                  <span className="font-bold text-sm text-spice-900">Notifications & Updates</span>
                  <button onClick={() => clearClientNotifications()} className="text-xs text-spice-500 hover:underline">Mark all read</button>
                </div>
                <div className="space-y-2">
                  {myNotifs.length === 0 ? (
                    <p className="text-xs text-spice-900/50 text-center py-4">No notifications yet.</p>
                  ) : myNotifs.map(n => (
                    <div key={n.id} className={`p-3 rounded-xl border text-xs space-y-1 ${n.read ? 'bg-sand-50 opacity-75' : 'bg-spice-50 border-spice-200'}`}>
                      <p className="font-bold text-spice-900">{n.text}</p>
                      <span className="text-[10px] text-spice-900/50">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="text-spice-900/60 hover:text-red-500 text-sm font-bold hidden sm:block">Sign Out</button>
          <button onClick={() => switchAppView('home')} className="btn-secondary py-2 px-4 text-sm"><i className="fa-solid fa-arrow-left"></i> Back to Home</button>
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex justify-between items-end mb-2 border-b border-sand-200 pb-4">
          <h2 className="text-2xl font-serif font-bold text-spice-900">Active Reservations</h2>
          <button onClick={startNewBooking} className="text-spice-500 hover:text-spice-600 font-bold text-sm"><i className="fa-solid fa-plus"></i> New Booking</button>
        </div>

        <div className="space-y-4">
          {myBookings.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-sand-200 text-center shadow-soft mt-4">
              <i className="fa-regular fa-calendar-xmark text-5xl text-spice-900/20 mb-4 block"></i>
              <h3 className="text-xl font-bold text-spice-900 mb-2">No bookings found</h3>
              <p className="text-sm text-spice-900/60 mb-6">You haven't made any reservations with us yet.</p>
              <button onClick={startNewBooking} className="btn-primary">Book an Event</button>
            </div>
          ) : myBookings.map(r => {
            const badge = BADGE[r.status] || 'bg-yellow-100 text-yellow-800';
            const msgCount = r.messages ? r.messages.length : 0;
            let changeReqBadge = null;
            if (r.changeRequest?.status === 'Pending') changeReqBadge = <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800">Change Requested (Pending Owner Approval)</span>;
            else if (r.changeRequest?.status === 'Approved') changeReqBadge = <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-800">Changes Approved</span>;

            return (
              <div key={r.id} className="bg-white p-6 lg:p-8 rounded-3xl border border-sand-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-soft transition-shadow">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h4 className="font-serif font-bold text-spice-900 text-xl">{r.eventTitle}</h4>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${badge}`}>{r.status}</span>
                    <span className="text-xs text-spice-900/50 bg-sand-100 px-2 py-1 rounded-md font-medium">#RES-{r.id}</span>
                    {changeReqBadge}
                  </div>
                  <div className="flex flex-col gap-1.5 mt-3">
                    <p className="text-sm text-spice-900/70 flex items-center gap-2"><i className="fa-regular fa-calendar w-4 text-spice-400 text-center"></i> <strong className="text-spice-900">{r.date}</strong> at {r.startTime}</p>
                    <p className="text-sm text-spice-900/70 flex items-center gap-2"><i className="fa-solid fa-location-dot w-4 text-spice-400 text-center"></i> {r.venue}</p>
                    <p className="text-sm text-spice-900/70 flex items-center gap-2"><i className="fa-solid fa-bell-concierge w-4 text-spice-400 text-center"></i> {r.package?.name}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button onClick={() => openClientDetail(r.id)} className="btn-primary py-2 px-4 text-xs font-bold shadow-sm">
                      <i className="fa-solid fa-eye"></i> View Full Details
                    </button>
                    <button onClick={() => openChat(r.id, 'client')} className="btn-secondary py-2 px-4 text-xs font-bold border-spice-200 text-spice-700 hover:bg-spice-50 group transition-colors">
                      <i className="fa-regular fa-comments group-hover:text-spice-500 transition-colors"></i> Messages
                      {msgCount > 0 && <span className="bg-spice-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold ml-1">{msgCount}</span>}
                    </button>
                    {r.status !== 'Cancelled' && (
                      <button onClick={() => requestChanges(r.id)} className="btn-secondary py-2 px-4 text-xs font-bold border-spice-200 text-spice-900 hover:bg-sand-100 transition-colors"><i className="fa-solid fa-pen-to-square text-spice-500"></i> Request Changes</button>
                    )}
                  </div>
                </div>
                <div className="text-left md:text-right w-full md:w-auto bg-sand-50 md:bg-transparent p-5 md:p-0 rounded-2xl border border-sand-200 md:border-none">
                  <span className="block text-[10px] uppercase tracking-widest font-bold text-spice-900/50 mb-1">Total Quote</span>
                  <span className="font-serif font-bold text-spice-500 text-3xl block">₱{r.package?.price.toLocaleString()}</span>
                  <div className="mt-3 md:mt-4 grid grid-cols-3 gap-2 text-center text-xs md:text-[10px] font-medium text-spice-900/60 bg-white md:bg-transparent p-2 md:p-0 rounded-lg">
                    <div className={r.payments.fee ? 'text-green-600 font-bold' : ''}>Fee<br />{r.payments.fee ? <i className="fa-solid fa-check"></i> : '20%'}</div>
                    <div className={r.payments.down ? 'text-green-600 font-bold' : ''}>Down<br />{r.payments.down ? <i className="fa-solid fa-check"></i> : '30%'}</div>
                    <div className={r.payments.bal ? 'text-green-600 font-bold' : ''}>Bal<br />{r.payments.bal ? <i className="fa-solid fa-check"></i> : '50%'}</div>
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
