import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { CONFIG } from '../data/data.js';
import Calendar from './manager/Calendar.jsx';
import OperationsList from './manager/OperationsList.jsx';

export default function ManagerDashboard() {
  const { switchAppView, reservationsQueue, openBlackoutModal, openDetail, currentUser } = useApp();

  const [page, setPage] = useState('calendar');
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (currentUser?.role !== 'manager') switchAppView('home');
  }, [currentUser, switchAppView]);

  const searchQuery = search.toLowerCase().trim();

  const kpis = useMemo(() => {
    let pending = 0, awaiting = 0, up7 = 0, out = 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const in7 = new Date(today); in7.setDate(today.getDate() + 7);

    reservationsQueue.forEach(r => {
      if (r.status === 'Cancelled') return;
      if (r.status === 'Pending') pending++;
      if (r.status === 'Approved') awaiting++;

      const evD = new Date(r.date + 'T00:00:00');
      if (evD >= today && evD <= in7) up7++;

      if (r.status !== 'FullyPaid') {
        const price = r.package.price;
        let paid = 0;
        if (r.payments.fee) paid += price * CONFIG.reservationFeePct;
        if (r.payments.down) paid += price * CONFIG.downpaymentPct;
        out += (price - paid);
      }
    });
    return { pending, awaiting, up7, out: Math.round(out) };
  }, [reservationsQueue]);

  const pendingBookings = reservationsQueue.filter(r => r.status === 'Pending');
  const pendingChanges = reservationsQueue.filter(r => r.changeRequest && r.changeRequest.status === 'Pending');
  const totalAlerts = pendingBookings.length + pendingChanges.length;

  function goToListFiltered(status) {
    setPage('list');
    window.dispatchEvent(new CustomEvent('set-list-filter', { detail: { status } }));
  }

  return (
    <div className="bg-sand-50 flex flex-col min-h-screen">
      <header className="bg-white border-b border-sand-200 px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center justify-between w-full lg:w-auto">
          <div className="flex items-center gap-3">
            <div className="bg-spice-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md"><i className="fa-solid fa-chart-line"></i></div>
            <div><h1 className="font-serif font-bold text-lg text-spice-900 leading-none">CuiZin Manager</h1><p className="text-xs text-spice-900/50">JannaSpice Operations</p></div>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <button onClick={() => setNotifOpen(o => !o)} className="w-10 h-10 rounded-full bg-sand-100 text-spice-900 flex items-center justify-center relative">
              <i className="fa-regular fa-bell"></i>
              {totalAlerts > 0 && <span className="absolute -top-1 -right-1 bg-spice-500 text-white w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center">{totalAlerts}</span>}
            </button>
            <button onClick={() => setSidebarOpen(o => !o)} className="text-spice-900 focus:outline-none"><i className="fa-solid fa-bars text-xl"></i></button>
          </div>
        </div>

        <div className="flex-1 max-w-md relative hidden lg:block">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-spice-900/30 text-sm"></i>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, venue..." className="input-modern pl-10 py-2.5 text-sm" />
        </div>
        <div className="hidden lg:flex items-center gap-3 flex-wrap">
          <div className="relative">
            <button onClick={() => setNotifOpen(o => !o)} className="btn-secondary py-2.5 px-4 text-sm relative">
              <i className="fa-regular fa-bell"></i> Notifications
              {totalAlerts > 0 && <span className="absolute -top-1 -right-1 bg-spice-500 text-white w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center">{totalAlerts}</span>}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-soft border border-sand-200 z-50 p-4 max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center mb-3 border-b border-sand-200 pb-2">
                  <span className="font-bold text-sm text-spice-900">Owner Notifications</span>
                  <span className="text-xs text-spice-900/50">Requested Bookings & Changes</span>
                </div>
                <div className="space-y-2">
                  {totalAlerts === 0 ? (
                    <p className="text-xs text-spice-900/50 text-center py-4">No pending owner notifications.</p>
                  ) : (
                    <>
                      {pendingBookings.map(r => (
                        <div key={'b' + r.id} onClick={() => { openDetail(r.id); setNotifOpen(false); }} className="p-3 bg-yellow-50 rounded-xl border border-yellow-200 text-xs cursor-pointer hover:bg-yellow-100 transition-colors">
                          <span className="font-bold text-yellow-800 block">New Booking Request</span>
                          <p className="text-spice-900">{r.name} - #RES-{r.id}</p>
                        </div>
                      ))}
                      {pendingChanges.map(r => (
                        <div key={'c' + r.id} onClick={() => { openDetail(r.id); setNotifOpen(false); }} className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-xs cursor-pointer hover:bg-orange-100 transition-colors">
                          <span className="font-bold text-orange-800 block">Change Request Pending</span>
                          <p className="text-spice-900">{r.name} - #RES-{r.id}</p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={openBlackoutModal} className="btn-secondary py-2.5 px-4 text-sm"><i className="fa-solid fa-ban"></i> Blackout Dates</button>
          <button onClick={() => switchAppView('home')} className="btn-secondary py-2.5 px-4 text-sm"><i className="fa-solid fa-arrow-left"></i> View Site</button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 relative">
        {sidebarOpen && <div className="fixed inset-0 bg-spice-900/50 backdrop-blur-sm z-[45] lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

        <aside className={`w-64 bg-white border-r border-sand-200 p-4 lg:p-6 flex flex-col gap-2 shrink-0 fixed lg:relative z-50 lg:z-auto h-full lg:h-auto top-0 left-0 transition-transform duration-300 shadow-xl lg:shadow-none ${sidebarOpen ? '' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="flex justify-between items-center lg:hidden mb-4 border-b border-sand-200 pb-4">
            <span className="font-serif font-bold text-spice-900">Menu</span>
            <button onClick={() => setSidebarOpen(false)} className="text-spice-900/60 text-xl"><i className="fa-solid fa-xmark"></i></button>
          </div>
          <div className="lg:hidden mb-4 relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-spice-900/30 text-sm"></i>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input-modern pl-10 py-2.5 text-sm w-full" />
          </div>

          <button onClick={() => { setPage('calendar'); setSidebarOpen(false); }} className={`shrink-0 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${page === 'calendar' ? 'bg-spice-100 text-spice-900' : 'text-spice-900/60 hover:bg-sand-100'}`}><i className="fa-regular fa-calendar w-4"></i> Calendar</button>
          <button onClick={() => { setPage('list'); setSidebarOpen(false); }} className={`shrink-0 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${page === 'list' ? 'bg-spice-100 text-spice-900' : 'text-spice-900/60 hover:bg-sand-100'}`}><i className="fa-solid fa-list-check w-4"></i> Operations List</button>
        </aside>

        <main className="flex-1 p-4 lg:p-8 space-y-6 min-w-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div tabIndex={0} onClick={() => goToListFiltered('Pending')} className="cursor-pointer bg-white p-5 rounded-2xl shadow-sm border border-sand-200 border-l-4 border-l-yellow-400 hover:shadow-soft transition-shadow">
              <span className="block text-xs font-medium text-spice-900/60 mb-1">Pending Requests</span><span className="font-bold text-2xl lg:text-3xl text-spice-900">{kpis.pending}</span>
            </div>
            <div tabIndex={0} onClick={() => goToListFiltered('Approved')} className="cursor-pointer bg-white p-5 rounded-2xl shadow-sm border border-sand-200 border-l-4 border-l-blue-400 hover:shadow-soft transition-shadow">
              <span className="block text-xs font-medium text-spice-900/60 mb-1">Awaiting Contract</span><span className="font-bold text-2xl lg:text-3xl text-spice-900">{kpis.awaiting}</span>
            </div>
            <div tabIndex={0} onClick={() => setPage('calendar')} className="cursor-pointer bg-white p-5 rounded-2xl shadow-sm border border-sand-200 border-l-4 border-l-green-500 hover:shadow-soft transition-shadow">
              <span className="block text-xs font-medium text-spice-900/60 mb-1">Events (7 Days)</span><span className="font-bold text-2xl lg:text-3xl text-spice-500">{kpis.up7}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-sand-200 border-l-4 border-l-spice-500">
              <span className="block text-xs font-medium text-spice-900/60 mb-1">Total Outstanding</span><span className="font-bold text-2xl lg:text-3xl text-spice-900">₱{kpis.out.toLocaleString()}</span>
            </div>
          </div>

          {page === 'calendar' && <Calendar searchQuery={searchQuery} />}
          {page === 'list' && <OperationsList searchQuery={searchQuery} />}
        </main>
      </div>
    </div>
  );
}
