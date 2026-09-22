import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { CONFIG } from '../data/data.js';
import Calendar from './manager/Calendar.jsx';
import OperationsList from './manager/OperationsList.jsx';
import { AppHeader, IconButton } from './ui/index.jsx';

export default function ManagerDashboard() {
  const { switchAppView, reservationsQueue, openBlackoutModal, openDetail, currentUser, openCatalogModal, openProfileModal } = useApp();

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
  const pendingCancels = reservationsQueue.filter(r => r.cancelRequest && r.cancelRequest.status === 'pending');
  const pendingProofs = reservationsQueue.filter(r => (r.paymentProofs || []).some(p => p.status === 'pending'));
  const totalAlerts = pendingBookings.length + pendingChanges.length + pendingCancels.length + pendingProofs.length;

  function goToListFiltered(status) {
    setPage('list');
    window.dispatchEvent(new CustomEvent('set-list-filter', { detail: { status } }));
  }

  return (
    <div className="bg-sand-50 flex flex-col min-h-[100dvh]">
      <AppHeader icon="fa-chart-line" title="CuiZin Manager" subtitle="Operations" wide>
        <div className="flex-1 max-w-md relative hidden lg:block mr-auto">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-spice-900/30 text-sm"></i>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, venue" className="input-modern !py-2.5 pl-10 text-sm" />
        </div>
        <div className="relative">
          <button type="button" onClick={() => setNotifOpen(o => !o)} className="icon-btn relative lg:hidden" aria-label="Notifications">
            <i className="fa-regular fa-bell"></i>
          </button>
          <button type="button" onClick={() => setNotifOpen(o => !o)} className="btn-secondary btn-sm relative hidden lg:inline-flex">
            Notifications
          </button>
          {totalAlerts > 0 && <span className="absolute -top-1 -right-1 bg-spice-500 text-white w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center">{totalAlerts}</span>}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-soft border border-sand-200 z-50 p-4 max-h-96 overflow-y-auto">
              <div className="mb-3 border-b border-sand-200 pb-2">
                <span className="font-bold text-sm text-spice-900">Needs action</span>
              </div>
              <div className="space-y-2">
                {totalAlerts === 0 ? (
                  <p className="text-xs text-spice-900/50 text-center py-4">Nothing waiting.</p>
                ) : (
                  <>
                    {pendingBookings.map(r => (
                      <button type="button" key={'b' + r.id} onClick={() => { openDetail(r.id); setNotifOpen(false); }} className="w-full text-left p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs hover:bg-amber-100">
                        <span className="font-bold text-amber-800 block">New booking</span>
                        <p className="text-spice-900">{r.name} · #RES-{r.id}</p>
                      </button>
                    ))}
                    {pendingChanges.map(r => (
                      <button type="button" key={'c' + r.id} onClick={() => { openDetail(r.id); setNotifOpen(false); }} className="w-full text-left p-3 bg-orange-50 rounded-xl border border-orange-200 text-xs hover:bg-orange-100">
                        <span className="font-bold text-orange-800 block">Change request</span>
                        <p className="text-spice-900">{r.name} · #RES-{r.id}</p>
                      </button>
                    ))}
                    {pendingCancels.map(r => (
                      <button type="button" key={'x' + r.id} onClick={() => { openDetail(r.id); setNotifOpen(false); }} className="w-full text-left p-3 bg-red-50 rounded-xl border border-red-200 text-xs hover:bg-red-100">
                        <span className="font-bold text-red-800 block">Cancellation</span>
                        <p className="text-spice-900">{r.name} · #RES-{r.id}</p>
                      </button>
                    ))}
                    {pendingProofs.map(r => (
                      <button type="button" key={'p' + r.id} onClick={() => { openDetail(r.id); setNotifOpen(false); }} className="w-full text-left p-3 bg-violet-50 rounded-xl border border-violet-200 text-xs hover:bg-violet-100">
                        <span className="font-bold text-violet-800 block">Payment proof</span>
                        <p className="text-spice-900">{r.name} · #RES-{r.id}</p>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <button type="button" onClick={openCatalogModal} className="btn-secondary btn-sm hidden lg:inline-flex">Catalog</button>
        <button type="button" onClick={openBlackoutModal} className="btn-secondary btn-sm hidden lg:inline-flex">Blackouts</button>
        <IconButton className="lg:hidden" onClick={() => setSidebarOpen(o => !o)} label="Menu" icon="fa-bars" />
      </AppHeader>

      <div className="flex flex-col lg:flex-row flex-1 relative">
        {sidebarOpen && <div className="fixed inset-0 bg-spice-900/50 backdrop-blur-sm z-[45] lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

        <aside className={`w-64 bg-white border-r border-sand-200 p-4 lg:p-6 flex flex-col gap-2 shrink-0 fixed lg:relative z-50 lg:z-auto h-full lg:h-auto top-0 left-0 transition-transform duration-300 shadow-xl lg:shadow-none ${sidebarOpen ? '' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="flex justify-between items-center lg:hidden mb-4 border-b border-sand-200 pb-4">
            <span className="font-serif font-bold text-spice-900">Menu</span>
            <button type="button" onClick={() => setSidebarOpen(false)} className="icon-btn" aria-label="Close menu"><i className="fa-solid fa-xmark"></i></button>
          </div>
          <div className="lg:hidden mb-4 relative">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-spice-900/30 text-sm"></i>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input-modern pl-10 py-2.5 text-sm w-full" />
          </div>

          <button onClick={() => { setPage('calendar'); setSidebarOpen(false); }} className={`shrink-0 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${page === 'calendar' ? 'bg-spice-100 text-spice-900' : 'text-spice-900/60 hover:bg-sand-100'}`}><i className="fa-regular fa-calendar w-4"></i> Calendar</button>
          <button onClick={() => { setPage('list'); setSidebarOpen(false); }} className={`shrink-0 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${page === 'list' ? 'bg-spice-100 text-spice-900' : 'text-spice-900/60 hover:bg-sand-100'}`}><i className="fa-solid fa-list-check w-4"></i> Operations List</button>
          <button onClick={() => { openCatalogModal(); setSidebarOpen(false); }} className="shrink-0 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-spice-900/60 hover:bg-sand-100"><i className="fa-solid fa-tags w-4"></i> Catalog & prices</button>
          <button onClick={() => { openProfileModal(); setSidebarOpen(false); }} className="shrink-0 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-spice-900/60 hover:bg-sand-100"><i className="fa-regular fa-user w-4"></i> Profile</button>
        </aside>

        <main className="flex-1 p-4 lg:p-8 space-y-6 min-w-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div tabIndex={0} onClick={() => goToListFiltered('Pending')} className="cursor-pointer surface-card p-5 border-l-4 border-l-amber-400">
              <span className="block text-xs font-medium text-spice-900/60 mb-1">Pending</span><span className="font-bold text-2xl lg:text-3xl text-spice-900">{kpis.pending}</span>
            </div>
            <div tabIndex={0} onClick={() => goToListFiltered('Approved')} className="cursor-pointer surface-card p-5 border-l-4 border-l-sky-400">
              <span className="block text-xs font-medium text-spice-900/60 mb-1">Awaiting fee</span><span className="font-bold text-2xl lg:text-3xl text-spice-900">{kpis.awaiting}</span>
            </div>
            <div tabIndex={0} onClick={() => setPage('calendar')} className="cursor-pointer surface-card p-5 border-l-4 border-l-emerald-500">
              <span className="block text-xs font-medium text-spice-900/60 mb-1">Next 7 days</span><span className="font-bold text-2xl lg:text-3xl text-spice-500">{kpis.up7}</span>
            </div>
            <div className="surface-card p-5 border-l-4 border-l-spice-500">
              <span className="block text-xs font-medium text-spice-900/60 mb-1">Outstanding</span><span className="font-bold text-2xl lg:text-3xl text-spice-900">₱{kpis.out.toLocaleString()}</span>
            </div>
          </div>

          {page === 'calendar' && <Calendar searchQuery={searchQuery} />}
          {page === 'list' && <OperationsList searchQuery={searchQuery} />}
        </main>
      </div>
    </div>
  );
}
