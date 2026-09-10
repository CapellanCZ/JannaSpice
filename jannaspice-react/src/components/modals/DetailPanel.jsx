import { useApp } from '../../context/AppContext.jsx';
import { printReceipt } from '../../utils/printReceipt.js';

export default function DetailPanel() {
  const { detailPanel, closeDetail, reservationsQueue, CONFIG, updateReservationStatus,
          logPayment, cancelReservation, approveChangeRequest, rejectChangeRequest,
          customAlert, openChat, openDetail } = useApp();

  const res = detailPanel.resId ? reservationsQueue.find(r => r.id === detailPanel.resId) : null;

  if (!res) {
    return (
      <>
        <div className={`fixed inset-0 bg-spice-900/50 backdrop-blur-sm z-[70] ${detailPanel.open ? '' : 'hidden'}`} onClick={closeDetail}></div>
        <aside className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white z-[80] shadow-2xl transform transition-transform duration-300 flex flex-col ${detailPanel.open ? 'translate-x-0' : 'translate-x-full'}`}></aside>
      </>
    );
  }

  const p = res.package.price;
  const fee = p * CONFIG.reservationFeePct, down = p * CONFIG.downpaymentPct, bal = p - fee - down;
  let paid = 0;
  if (res.payments.fee) paid += fee;
  if (res.payments.down) paid += down;
  if (res.payments.bal) paid += bal;

  function promptCancel() {
    customAlert('Are you sure you want to cancel this booking?', 'Cancel Booking', 'confirm', (confirmed) => {
      if (confirmed) {
        cancelReservation(res.id);
        closeDetail();
        customAlert('Booking has been cancelled.', 'Success', 'success');
      }
    });
  }

  function milestones() {
    if (res.status === 'Cancelled') {
      return <div className="p-4 bg-red-50 text-red-700 font-bold rounded-xl text-center">BOOKING CANCELLED</div>;
    }
    const isApp = res.status !== 'Pending';
    return (
      <div className="space-y-3">
        <div className={`p-3 border rounded-xl flex justify-between items-center ${isApp ? 'bg-green-50 border-green-200' : 'border-yellow-200'}`}>
          <div><span className="block font-bold text-sm">1. Initial Approval</span><span className="text-xs">Review logistics</span></div>
          {!isApp ? <button onClick={() => updateReservationStatus(res.id, 'Approved')} className="btn-primary py-1 px-3 text-xs">Approve</button> : <i className="fa-solid fa-check text-green-500"></i>}
        </div>
        <div className={`p-3 border rounded-xl flex justify-between items-center ${res.payments.fee ? 'bg-green-50 border-green-200' : 'border-sand-200'}`}>
          <div><span className="block font-bold text-sm">2. 20% Reservation</span><span className="text-xs">₱{fee.toLocaleString()}</span></div>
          {res.payments.fee ? <i className="fa-solid fa-check text-green-500"></i> : <button onClick={() => logPayment(res.id, 'fee')} disabled={!isApp} className="btn-primary py-1 px-3 text-xs">Log Paid</button>}
        </div>
        <div className={`p-3 border rounded-xl flex justify-between items-center ${res.payments.down ? 'bg-green-50 border-green-200' : 'border-sand-200'}`}>
          <div><span className="block font-bold text-sm">3. 30% Downpayment</span><span className="text-xs">₱{down.toLocaleString()}</span></div>
          {res.payments.down ? <i className="fa-solid fa-check text-green-500"></i> : <button onClick={() => logPayment(res.id, 'down')} disabled={!res.payments.fee} className="btn-primary py-1 px-3 text-xs">Log Paid</button>}
        </div>
        <div className={`p-3 border rounded-xl flex justify-between items-center ${res.payments.bal ? 'bg-green-50 border-green-200' : 'border-sand-200'}`}>
          <div><span className="block font-bold text-sm">4. Final Settlement</span><span className="text-xs">₱{bal.toLocaleString()}</span></div>
          {res.payments.bal ? <i className="fa-solid fa-check text-green-500"></i> : <button onClick={() => logPayment(res.id, 'bal')} disabled={!res.payments.down} className="btn-primary py-1 px-3 text-xs">Log Paid</button>}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`fixed inset-0 bg-spice-900/50 backdrop-blur-sm z-[70] ${detailPanel.open ? '' : 'hidden'}`} onClick={closeDetail}></div>
      <aside className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white z-[80] shadow-2xl transform transition-transform duration-300 flex flex-col ${detailPanel.open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="bg-spice-900 text-white p-6 flex justify-between items-start shrink-0">
          <div>
            <p className="text-xs text-spice-100/60 font-bold uppercase tracking-wider mb-1">RESERVATION #RES-{res.id}</p>
            <h3 className="font-serif font-bold text-2xl">Operations Sheet</h3>
            <div className="mt-3"><span className="px-3 py-1 rounded-full text-xs font-bold bg-spice-700 uppercase">{res.status}</span></div>
          </div>
          <button onClick={closeDetail} className="w-9 h-9 rounded-full bg-spice-800 hover:bg-spice-700 flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="p-4 border-b border-sand-200 flex gap-2 shrink-0 bg-sand-50">
          <button onClick={() => openChat(res.id, 'manager')} className="btn-secondary flex-1 text-xs py-2"><i className="fa-regular fa-comments"></i> Messages</button>
          <button onClick={() => printReceipt(res)} className="btn-secondary flex-1 text-xs py-2"><i className="fa-solid fa-print"></i> Print Receipt</button>
          <button onClick={promptCancel} className="flex-1 text-xs py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-medium flex items-center justify-center gap-2 transition-colors"><i className="fa-solid fa-ban"></i> Cancel</button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto grow">
          {res.changeRequest && res.changeRequest.status === 'Pending' && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2"><i className="fa-solid fa-triangle-exclamation mr-1"></i> Client Change Request Pending</h4>
              <div className="text-xs text-spice-900/80 space-y-1 mb-3">
                <p><strong>Title:</strong> {res.changeRequest.data.eventTitle}</p>
                <p><strong>Date & Time:</strong> {res.changeRequest.data.date} @ {res.changeRequest.data.startTime}</p>
                <p><strong>Venue:</strong> {res.changeRequest.data.venue}</p>
                <p><strong>Package:</strong> {res.changeRequest.data.package.name}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { approveChangeRequest(res.id); openDetail(res.id); }} className="btn-primary py-1.5 px-4 text-xs bg-green-600 hover:bg-green-700 border-none">Approve Changes</button>
                <button onClick={() => { rejectChangeRequest(res.id); openDetail(res.id); }} className="btn-secondary py-1.5 px-4 text-xs text-red-600 border-red-200 hover:bg-red-50">Reject</button>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold text-spice-900/50 uppercase tracking-wider mb-1">Client Contact</h4>
            <div className="font-bold text-lg text-spice-900">{res.name}</div>
            <div className="text-sm text-spice-900/70 flex flex-col gap-1 mt-2">
              <a href={`tel:${res.phone}`} className="hover:text-spice-500"><i className="fa-solid fa-phone text-spice-400 w-4"></i> {res.phone}</a>
              <a href={`mailto:${res.email}`} className="hover:text-spice-500"><i className="fa-solid fa-envelope text-spice-400 w-4"></i> {res.email}</a>
            </div>
          </div>
          <div className="pt-4 border-t border-sand-200">
            <h4 className="text-xs font-bold text-spice-900/50 uppercase tracking-wider mb-2">Event Logistics & Design</h4>
            <ul className="space-y-2 text-sm text-spice-900">
              <li><i className="fa-solid fa-bell-concierge text-spice-400 w-4"></i> <strong>{res.package.name}</strong> ({res.package.pax} Pax)</li>
              <li><i className="fa-regular fa-calendar text-spice-400 w-4"></i> <span className="font-medium">{res.date}</span> @ {res.startTime}</li>
              <li><i className="fa-solid fa-location-dot text-spice-400 w-4"></i> <span className="font-medium">{res.venue}</span></li>
              <li><i className="fa-solid fa-palette text-spice-400 w-4"></i> Theme: <span className="font-medium">{res.theme || 'N/A'}</span></li>
              <li><i className="fa-solid fa-seedling text-spice-400 w-4"></i> Centerpiece: <span className="font-medium">{res.centerpiece || 'Artificial Flowers'}</span></li>
              <li><i className="fa-solid fa-font text-spice-400 w-4"></i> Styro Name: <span className="font-medium">{res.styroAvail ? (res.styroName || 'Yes (No name specified)') : 'Not Availed'}</span></li>
            </ul>
          </div>
          <div className="pt-4 border-t border-sand-200">
            <h4 className="text-xs font-bold text-spice-900/50 uppercase tracking-wider mb-2">Catering Menu</h4>
            <div className="bg-sand-50 rounded-xl p-4 border border-sand-200 text-sm space-y-1">
              {res.package.type === 'rental' ? (
                <span className="italic text-spice-900/60">Equipment Rental Only. No food provided.</span>
              ) : res.menu ? (
                <>
                  <div><span className="font-bold">Chicken:</span> {res.menu.chicken}</div>
                  <div><span className="font-bold">Pork/Beef:</span> {res.menu.beefPork}</div>
                  <div><span className="font-bold">Fish/Sea:</span> {res.menu.fishSeafood}</div>
                  <div><span className="font-bold">Veg:</span> {res.menu.veg}</div>
                  <div><span className="font-bold">Pasta:</span> {res.menu.pasta}</div>
                  <div className="text-xs text-spice-900/60 pt-2 border-t border-sand-200 mt-2"><i className="fa-solid fa-info-circle"></i> + {res.menu.staples}</div>
                </>
              ) : null}
            </div>
          </div>
          <div className="pt-4 border-t border-sand-200">
            <h4 className="text-xs font-bold text-spice-900/50 uppercase tracking-wider mb-3">Payment Breakdown</h4>
            <div className="bg-sand-50 rounded-xl border border-sand-200 p-5 text-sm space-y-2">
              <div className="flex justify-between font-bold text-spice-900 pb-2 border-b border-sand-200"><span>Total Value</span><span className="font-serif text-lg text-spice-500">₱{p.toLocaleString()}</span></div>
              <div className="pt-2 grid grid-cols-3 gap-2 text-center">
                <div><p className="text-[10px] uppercase text-spice-900/50 font-bold">20% Fee</p><p className="font-bold text-spice-900">₱{fee.toLocaleString()}</p></div>
                <div><p className="text-[10px] uppercase text-spice-900/50 font-bold">30% Down</p><p className="font-bold text-spice-900">₱{down.toLocaleString()}</p></div>
                <div><p className="text-[10px] uppercase text-spice-900/50 font-bold">50% Bal</p><p className="font-bold text-spice-900">₱{bal.toLocaleString()}</p></div>
              </div>
              <div className="flex justify-between pt-3 mt-1 border-t border-sand-200"><span className="font-bold text-red-600 text-sm">Outstanding Now</span><span className="font-bold text-red-600">₱{(p - paid).toLocaleString()}</span></div>
            </div>
          </div>
          <div className="pt-2">{milestones()}</div>
        </div>
      </aside>
    </>
  );
}
