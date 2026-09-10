import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Field, ModalHeader, ModalShell } from '../ui/index.jsx';

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
    <ModalShell open onClose={closeBlackoutModal} labelledBy="blackout-title">
      <ModalHeader id="blackout-title" title="Blackout dates" subtitle="Block dates that should not accept bookings." onClose={closeBlackoutModal} />
      <div className="ui-dialog-body">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start">
              <input type="date" value={start} onChange={e => setStart(e.target.value)} className="input-modern" required />
            </Field>
            <Field label="End">
              <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="input-modern" />
            </Field>
          </div>
          <Field label="Reason">
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="input-modern" required />
          </Field>
          <button type="submit" className="w-full btn-primary">Add block</button>
        </form>
        <div className="space-y-2">
          {blackoutDates.length === 0 ? (
            <p className="text-sm text-spice-900/50 text-center py-4">No blackouts yet. Open dates stay bookable.</p>
          ) : blackoutDates.map(b => (
            <div key={b.id} className="flex justify-between items-center p-3 rounded-xl bg-sand-50 border border-sand-200 text-sm">
              <div>
                <span className="font-semibold text-spice-900 block">{b.start}{b.end ? ` to ${b.end}` : ''}</span>
                <span className="text-spice-900/60 text-xs">{b.reason}</span>
              </div>
              <button type="button" onClick={() => deleteBlackout(b.id)} className="icon-btn" aria-label="Delete blackout"><i className="fa-solid fa-trash-can"></i></button>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}
