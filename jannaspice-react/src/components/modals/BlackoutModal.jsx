import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export default function BlackoutModal() {
  const { blackoutModal, closeBlackoutModal, blackoutDates, addBlackout, deleteBlackout } = useApp();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');

  if (!blackoutModal.open) return null;

  function submit(e) {
    e.preventDefault();
    if (!start || !reason) return;
    addBlackout({ start, end: end || start, reason });
    setStart(''); setEnd(''); setReason('');
  }

  return (
    <div className="fixed inset-0 bg-spice-900/60 backdrop-blur-sm z-[95] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-soft w-full max-w-md p-8 relative max-h-[90vh] overflow-y-auto">
        <button onClick={closeBlackoutModal} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-sand-100 text-spice-900/60 hover:text-spice-900 hover:bg-sand-200"><i className="fa-solid fa-xmark"></i></button>
        <h3 className="font-serif font-bold text-2xl text-spice-900 mb-6">Blackout Dates</h3>
        <form onSubmit={submit} className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-spice-900 mb-1">Start</label><input type="date" value={start} onChange={e => setStart(e.target.value)} className="input-modern" required /></div>
            <div><label className="block text-sm font-medium text-spice-900 mb-1">End</label><input type="date" value={end} onChange={e => setEnd(e.target.value)} className="input-modern" /></div>
          </div>
          <div><label className="block text-sm font-medium text-spice-900 mb-1">Reason</label><input type="text" value={reason} onChange={e => setReason(e.target.value)} className="input-modern" required /></div>
          <button type="submit" className="w-full btn-primary">Add Block</button>
        </form>
        <div className="space-y-2">
          {blackoutDates.length === 0 ? (
            <p className="text-xs text-spice-900/50">No blackout dates active.</p>
          ) : blackoutDates.map(b => (
            <div key={b.id} className="flex justify-between items-center p-3 rounded-xl bg-sand-50 border border-sand-200 text-xs">
              <div><span className="font-bold text-spice-900 block">{b.start} {b.end ? 'to ' + b.end : ''}</span><span className="text-spice-900/60">{b.reason}</span></div>
              <button onClick={() => deleteBlackout(b.id)} className="text-red-600 hover:text-red-800"><i className="fa-solid fa-trash-can"></i></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
