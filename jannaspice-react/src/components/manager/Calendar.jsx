import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { CONFIG } from '../../data/data.js';

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOT = {
  Pending: 'bg-amber-50 text-amber-800',
  Approved: 'bg-sky-50 text-sky-800',
  Reserved: 'bg-violet-50 text-violet-800',
  DownpaymentVerified: 'bg-orange-50 text-orange-800',
  FullyPaid: 'bg-emerald-50 text-emerald-800'
};

export default function Calendar({ searchQuery }) {
  const { reservationsQueue, blackoutDates, openDetail } = useApp();
  const [viewDate, setViewDate] = useState(new Date());

  const y = viewDate.getFullYear(), m = viewDate.getMonth();
  const todayStr = new Date().toISOString().split('T')[0];
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startWeekday = new Date(y, m, 1).getDay();

  function changeMonth(delta) {
    setViewDate(d => { const nd = new Date(d); nd.setMonth(nd.getMonth() + delta); return nd; });
  }

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(<div key={'pad' + i} className="bg-sand-50/50 border border-sand-100 rounded-xl min-h-[110px] opacity-40"></div>);

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateKey === todayStr;
    const isBlack = blackoutDates.some(b => dateKey >= b.start && (b.end ? dateKey <= b.end : dateKey === b.start));
    const evs = reservationsQueue.filter(r => r.date === dateKey && r.status !== 'Cancelled' && (!searchQuery || r.name.toLowerCase().includes(searchQuery)));

    cells.push(
      <div key={d} className={`bg-white border rounded-xl min-h-[110px] p-2 flex flex-col justify-between hover:border-spice-300 ${isToday ? 'border-spice-500 shadow-sm' : 'border-sand-200'}`}>
        <div className="flex justify-between items-center mb-1">
          <span className={`text-xs font-bold ${isToday ? 'bg-spice-500 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-spice-900'}`}>{d}</span>
          {isBlack ? <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">CLOSED</span> : <span className="text-[9px] text-spice-900/40">{evs.length}/{CONFIG.maxEventsPerDay}</span>}
        </div>
        <div className="space-y-1">
          {evs.map(e => (
            <div key={e.id} onClick={() => openDetail(e.id)} className={`cursor-pointer text-[10px] p-1.5 rounded-lg font-medium truncate hover:opacity-80 ${DOT[e.status] || 'bg-amber-50 text-amber-800'}`}>{(e.name || 'Guest').split(' ')[0]}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="surface-card p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => changeMonth(-1)} className="icon-btn" aria-label="Previous month"><i className="fa-solid fa-chevron-left"></i></button>
          <h3 className="font-serif font-bold text-xl text-spice-900 w-48 text-center">{MONTH_NAMES[m]} {y}</h3>
          <button onClick={() => changeMonth(1)} className="icon-btn" aria-label="Next month"><i className="fa-solid fa-chevron-right"></i></button>
          <button onClick={() => setViewDate(new Date())} className="btn-ghost btn-sm">Today</button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-spice-900/60">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span>Pending</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400"></span>Approved</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-400"></span>Reserved</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400"></span>50% Paid</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Fully Paid</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-spice-900/50 uppercase mb-2">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>
      <div className="grid grid-cols-7 gap-2">{cells}</div>
    </div>
  );
}
