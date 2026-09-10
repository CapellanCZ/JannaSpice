import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

const TABS = ['All', 'Pending', 'Approved', 'Reserved', 'DownpaymentVerified', 'FullyPaid'];
const TAB_LABELS = { All: 'All', Pending: 'Pending', Approved: 'Approved', Reserved: 'Reserved', DownpaymentVerified: '50% Paid', FullyPaid: 'Fully Paid' };
const BADGE = {
  Pending: 'bg-yellow-100 text-yellow-800', Approved: 'bg-blue-100 text-blue-800', Reserved: 'bg-purple-100 text-purple-800',
  DownpaymentVerified: 'bg-orange-100 text-orange-800', FullyPaid: 'bg-green-100 text-green-800', Cancelled: 'bg-red-100 text-red-700'
};

export default function OperationsList({ searchQuery }) {
  const { reservationsQueue, openDetail } = useApp();
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    function onSetFilter(e) { setFilter(e.detail.status); }
    window.addEventListener('set-list-filter', onSetFilter);
    return () => window.removeEventListener('set-list-filter', onSetFilter);
  }, []);

  const filtered = reservationsQueue.filter(r => {
    if (filter !== 'All' && r.status !== filter) return false;
    if (searchQuery) return r.name.toLowerCase().includes(searchQuery) || `#res-${r.id}`.includes(searchQuery);
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-sand-200 overflow-hidden flex flex-col min-h-[500px]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-sand-200 bg-sand-50 gap-4 shrink-0">
          <h3 className="font-serif font-bold text-xl text-spice-900">Operations Pipeline</h3>
          <div className="flex flex-wrap bg-white rounded-lg p-1 border border-sand-200 shadow-sm gap-1">
            {TABS.map(t => (
              <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === t ? 'bg-spice-100 text-spice-900' : 'text-spice-900/60'}`}>{TAB_LABELS[t]}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto overflow-y-auto grow">
          <table className="w-full text-left text-sm min-w-[820px] relative">
            <thead className="text-xs font-bold text-spice-900/60 uppercase tracking-wider border-b border-sand-200 bg-white sticky top-0 z-10 shadow-sm">
              <tr><th className="p-4">Client</th><th className="p-4">Logistics</th><th className="p-4">Package</th><th className="p-4">Value</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-sand-100 bg-white">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-spice-900/40"><i className="fa-regular fa-folder-open text-4xl mb-2"></i><br />No records found.</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="hover:bg-sand-50 border-b border-sand-100">
                  <td className="p-4"><div className="font-bold text-spice-900">{r.name}</div><div className="text-xs text-spice-900/50">#RES-{r.id}</div></td>
                  <td className="p-4"><div className="font-medium text-spice-900">{r.date}</div><div className="text-xs text-spice-900/60">{r.venue}</div></td>
                  <td className="p-4"><div className="font-medium text-spice-900">{r.package.name}</div></td>
                  <td className="p-4 font-bold text-spice-900">₱{r.package.price.toLocaleString()}</td>
                  <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${BADGE[r.status] || 'bg-yellow-100 text-yellow-800'}`}>{r.status}</span></td>
                  <td className="p-4 text-right"><button onClick={() => openDetail(r.id)} className="btn-secondary py-1.5 px-3 text-xs">Manage</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
