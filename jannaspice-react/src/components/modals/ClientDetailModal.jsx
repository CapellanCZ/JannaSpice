import { useApp } from '../../context/AppContext.jsx';
import { printReceipt } from '../../utils/printReceipt.js';

export default function ClientDetailModal() {
  const { clientDetailModal, closeClientDetail, reservationsQueue, CONFIG } = useApp();
  const res = clientDetailModal.resId ? reservationsQueue.find(r => r.id === clientDetailModal.resId) : null;

  if (!clientDetailModal.open || !res) return null;

  const p = res.package.price;
  const fee = p * CONFIG.reservationFeePct, down = p * CONFIG.downpaymentPct, bal = p - fee - down;

  let changeReqInfo = null;
  if (res.changeRequest?.status === 'Pending') {
    changeReqInfo = <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-800 font-medium"><i className="fa-solid fa-hourglass-half mr-1"></i> Change Request Pending Owner Approval</div>;
  } else if (res.changeRequest?.status === 'Approved') {
    changeReqInfo = <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-medium"><i className="fa-solid fa-check-circle mr-1"></i> Change Request Approved by Owner</div>;
  }

  return (
    <div className="fixed inset-0 bg-spice-900/60 backdrop-blur-sm z-[95] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-soft w-full max-w-lg relative max-h-[90vh] flex flex-col overflow-hidden">
        <button onClick={closeClientDetail} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-sand-100 text-spice-900/60 hover:text-spice-900 hover:bg-sand-200 z-20"><i className="fa-solid fa-xmark"></i></button>
        <div className="space-y-6 p-6 lg:p-8 overflow-y-auto">
          <div className="flex justify-between items-start border-b border-sand-200 pb-4 pr-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-spice-500">Reservation #RES-{res.id}</span>
              <h3 className="font-serif font-bold text-2xl text-spice-900 mt-1">{res.eventTitle}</h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-spice-100 text-spice-800 uppercase shrink-0">{res.status}</span>
          </div>
          {changeReqInfo}
          <div className="bg-sand-50 rounded-2xl p-4 border border-sand-200 space-y-2 text-sm">
            <h4 className="font-bold text-spice-900 border-b border-sand-200 pb-2">Event Logistics & Design</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div><strong>Occasion:</strong> {res.eventType}</div>
              <div><strong>Date & Time:</strong> {res.date} @ {res.startTime}</div>
              <div className="sm:col-span-2"><strong>Venue:</strong> {res.venue}</div>
              <div><strong>Theme / Motif:</strong> {res.theme || 'N/A'}</div>
              <div><strong>Centerpiece:</strong> {res.centerpiece || 'Artificial Flowers'}</div>
              <div className="sm:col-span-2"><strong>Styro Name / Standee:</strong> {res.styroAvail ? res.styroName : 'Not Availed'}</div>
            </div>
          </div>
          <div className="bg-sand-50 rounded-2xl p-4 border border-sand-200 space-y-2">
            <h4 className="font-bold text-spice-900 border-b border-sand-200 pb-2 text-sm">Package & Menu Selection</h4>
            <p className="text-sm font-semibold text-spice-800">{res.package.name} (₱{p.toLocaleString()})</p>
            {res.package.type === 'rental' ? (
              <p className="text-sm italic text-spice-900/60">Equipment Rental Only. No food provided.</p>
            ) : res.menu ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-spice-900">
                <div>• <strong>Chicken:</strong> {res.menu.chicken}</div>
                <div>• <strong>Pork/Beef:</strong> {res.menu.beefPork}</div>
                <div>• <strong>Fish/Seafood:</strong> {res.menu.fishSeafood}</div>
                <div>• <strong>Vegetable:</strong> {res.menu.veg}</div>
                <div>• <strong>Pasta:</strong> {res.menu.pasta}</div>
                <div className="sm:col-span-2 text-xs text-spice-900/60 pt-1 border-t border-sand-200">+ {res.menu.staples}</div>
              </div>
            ) : null}
          </div>
          <div className="bg-sand-50 rounded-2xl p-4 border border-sand-200 space-y-2 text-sm">
            <h4 className="font-bold text-spice-900 border-b border-sand-200 pb-2">Payment Breakdown</h4>
            <div className="flex justify-between font-bold text-spice-900"><span>Total Value</span><span className="text-spice-500">₱{p.toLocaleString()}</span></div>
            <div className="grid grid-cols-3 gap-2 text-center pt-2 text-xs">
              <div className="bg-white p-2 rounded-lg border border-sand-200"><span className="block text-[10px] text-spice-900/50">20% Fee</span><strong>{res.payments.fee ? 'Paid ✓' : `₱${fee.toLocaleString()}`}</strong></div>
              <div className="bg-white p-2 rounded-lg border border-sand-200"><span className="block text-[10px] text-spice-900/50">30% Down</span><strong>{res.payments.down ? 'Paid ✓' : `₱${down.toLocaleString()}`}</strong></div>
              <div className="bg-white p-2 rounded-lg border border-sand-200"><span className="block text-[10px] text-spice-900/50">50% Bal</span><strong>{res.payments.bal ? 'Paid ✓' : `₱${bal.toLocaleString()}`}</strong></div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => printReceipt(res)} className="btn-secondary flex-1 text-xs py-2.5"><i className="fa-solid fa-print"></i> Print Receipt</button>
            <button onClick={closeClientDetail} className="btn-primary flex-1 text-xs py-2.5">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
