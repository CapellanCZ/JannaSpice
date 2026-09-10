import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { EmptyState, StatusBadge } from '../ui/index.jsx';

const TABS = ['All', 'Pending', 'Reserved', 'DownpaymentVerified', 'FullyPaid'];
const TAB_LABELS = { All: 'All', Pending: 'Pending', Reserved: 'Reserved', DownpaymentVerified: '50% Paid', FullyPaid: 'Fully Paid' };

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
    <div className="surface-card overflow-hidden flex flex-col min-h-[500px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 border-b border-sand-200 bg-sand-50 gap-4">
        <h3 className="font-serif font-bold text-xl text-spice-900">Pipeline</h3>
        <div className="flex flex-wrap bg-white rounded-full p-1 border border-sand-200 gap-1">
          {TABS.map(t => (
            <button key={t} type="button" onClick={() => setFilter(t)} className={`ui-tab ${filter === t ? 'ui-tab-active' : 'ui-tab-idle'}`}>{TAB_LABELS[t]}</button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto overflow-y-auto grow">
        <table className="w-full text-left text-sm min-w-[820px]">
          <thead className="text-[11px] font-bold text-spice-900/50 uppercase tracking-wider border-b border-sand-200 bg-white sticky top-0 z-10">
            <tr>
              <th className="p-4 font-semibold">Client</th>
              <th className="p-4 font-semibold">Logistics</th>
              <th className="p-4 font-semibold">Package</th>
              <th className="p-4 font-semibold">Value</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100 bg-white">
            {filtered.length === 0 ? (
              <tr><td colSpan={6}><EmptyState title="No records" body="Nothing matches this filter." /></td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="hover:bg-sand-50">
                <td className="p-4"><div className="font-semibold text-spice-900">{r.name}</div><div className="text-xs text-spice-900/50">#RES-{r.id}</div></td>
                <td className="p-4"><div className="font-medium text-spice-900">{r.date}</div><div className="text-xs text-spice-900/60">{r.venue}</div></td>
                <td className="p-4 font-medium text-spice-900">{r.package.name}</td>
                <td className="p-4 font-semibold text-spice-900">₱{r.package.price.toLocaleString()}</td>
                <td className="p-4"><StatusBadge status={r.status} /></td>
                <td className="p-4 text-right"><button type="button" onClick={() => openDetail(r.id)} className="btn-secondary btn-sm">Manage</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
