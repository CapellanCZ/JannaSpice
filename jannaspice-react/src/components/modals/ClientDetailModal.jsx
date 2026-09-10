import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { printReceipt } from '../../utils/printReceipt.js';
import { Banner, Field, IconButton, ModalShell, StatusBadge } from '../ui/index.jsx';

const PAYMENT_LABEL = { fee: '20% reservation fee', down: '30% downpayment', bal: '50% balance' };

const MENU_COURSES = [
  { key: 'chicken', label: 'Chicken', icon: 'fa-drumstick-bite' },
  { key: 'beefPork', label: 'Pork / Beef', icon: 'fa-bacon' },
  { key: 'fishSeafood', label: 'Fish / Seafood', icon: 'fa-fish' },
  { key: 'veg', label: 'Vegetable', icon: 'fa-leaf' },
  { key: 'pasta', label: 'Pasta', icon: 'fa-utensils' }
];

const SETUP_PHOTO = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80';

function formatDueAt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}

function dishImage(menuOptions, category, name) {
  if (!name) return '';
  const list = menuOptions?.[category] || [];
  const match = list.find((item) => item.name.toLowerCase() === String(name).toLowerCase());
  return match?.img || '';
}

function InfoTile({ icon, label, value, wide = false }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl bg-sand-50 border border-sand-200 p-3 ${wide ? 'sm:col-span-2' : ''}`}>
      <div className="w-9 h-9 rounded-full bg-white text-spice-500 flex items-center justify-center shrink-0 border border-sand-200">
        <i className={`fa-solid ${icon} text-sm`}></i>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-bold text-spice-900/45">{label}</p>
        <p className="text-sm font-semibold text-spice-900 leading-snug mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

function PayStep({ label, amount, paid }) {
  return (
    <div className={`rounded-xl border p-3 text-center ${paid ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-sand-200'}`}>
      <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center text-sm font-bold ${paid ? 'bg-emerald-500 text-white' : 'bg-sand-100 text-spice-900/50'}`}>
        {paid ? <i className="fa-solid fa-check text-xs"></i> : '₱'}
      </div>
      <p className="text-[10px] uppercase tracking-wider font-bold text-spice-900/50">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${paid ? 'text-emerald-700' : 'text-spice-900'}`}>{paid ? 'Paid' : `₱${amount.toLocaleString()}`}</p>
    </div>
  );
}

export default function ClientDetailModal() {
  const {
    clientDetailModal, closeClientDetail, reservationsQueue, CONFIG, currentUser,
    submitPaymentProof, requestCancellation, customAlert, nextPaymentType, pendingProofFor,
    menuOptions
  } = useApp();
  const res = clientDetailModal.resId ? reservationsQueue.find(r => r.id === clientDetailModal.resId) : null;
  const [file, setFile] = useState(null);
  const [referenceNo, setReferenceNo] = useState('');
  const [uploading, setUploading] = useState(false);

  if (!clientDetailModal.open || !res) return null;

  const p = res.package.price;
  const fee = p * CONFIG.reservationFeePct, down = p * CONFIG.downpaymentPct, bal = p - fee - down;
  const nextType = nextPaymentType(res);
  const pending = nextType ? pendingProofFor(res, nextType) : null;
  const canUpload = res.status !== 'Cancelled' && res.status !== 'Pending' && nextType && !pending;
  const canCancel = res.status !== 'Cancelled' && res.cancelRequest?.status !== 'pending';
  const paidSteps = [res.payments.fee, res.payments.down, res.payments.bal].filter(Boolean).length;

  const courses = res.package.type === 'rental' || !res.menu
    ? []
    : MENU_COURSES.map((course) => ({
        ...course,
        name: res.menu[course.key],
        img: dishImage(menuOptions, course.key, res.menu[course.key])
      })).filter((course) => course.name);

  async function uploadProof(e) {
    e.preventDefault();
    if (!file || !currentUser) return;
    setUploading(true);
    try {
      await submitPaymentProof({
        reservationId: res.id,
        userId: currentUser.id,
        paymentType: nextType,
        file,
        referenceNo,
        amount: nextType === 'fee' ? fee : nextType === 'down' ? down : bal
      });
      setFile(null);
      setReferenceNo('');
    } catch {
      // AppContext already alerts.
    } finally {
      setUploading(false);
    }
  }

  function promptCancel() {
    const policyNote = res.status === 'Pending'
      ? 'This pending request will be cancelled immediately and the date will open up.'
      : 'The owner will confirm using the 7-day / 3-day refund policy.';
    customAlert(policyNote, 'Cancel this booking?', 'confirm', async (confirmed) => {
      if (!confirmed) return;
      try {
        await requestCancellation(res.id);
      } catch {
        // already alerted
      }
    });
  }

  return (
    <ModalShell open onClose={closeClientDetail} size="xl" labelledBy="client-detail-title" flush>
      <div className="px-5 pt-5 pb-4 pr-14 border-b border-sand-200 shrink-0">
        <p className="text-[11px] font-semibold text-spice-900/50">Reservation #RES-{res.id}</p>
        <h3 id="client-detail-title" className="font-serif font-bold text-2xl text-spice-900 leading-tight mt-1">{res.eventTitle}</h3>
        <div className="mt-2.5"><StatusBadge status={res.status} /></div>
        <IconButton onClick={closeClientDetail} label="Close" className="dialog-close" />
      </div>

      <div className="ui-dialog-body !pt-4">
        {res.changeRequest?.status === 'Pending' && (
          <Banner tone="warn" icon="fa-hourglass-half">Change request pending owner approval.</Banner>
        )}
        {res.changeRequest?.status === 'Approved' && (
          <Banner tone="success" icon="fa-circle-check">Change request approved by owner.</Banner>
        )}
        {res.status === 'Approved' && res.paymentDueAt && !res.payments.fee && (
          <Banner tone="info" icon="fa-clock">Pay the 20% reservation fee by {formatDueAt(res.paymentDueAt)} (Manila time) or this date will be released.</Banner>
        )}
        {res.expiredReason === 'unpaid_deadline' && (
          <Banner tone="danger" icon="fa-circle-xmark">Cancelled automatically because the reservation fee was not paid on time.</Banner>
        )}
        {res.cancelRequest?.status === 'pending' && (
          <Banner tone="warn" icon="fa-ban">Cancellation requested. {res.cancelRequest.policy?.label || 'Waiting for owner confirmation'}.</Banner>
        )}

        {courses.length > 0 ? (
          <div className="grid grid-cols-5 gap-1.5 rounded-2xl overflow-hidden h-28 sm:h-36">
            {courses.map((course) => (
              <div key={course.key} className="relative h-full overflow-hidden bg-sand-100">
                {course.img ? (
                  <img src={course.img} alt={course.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-spice-400"><i className={`fa-solid ${course.icon}`}></i></div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden h-28 sm:h-36 bg-sand-100">
            <img src={SETUP_PHOTO} alt="Catering setup" className="w-full h-full object-cover" />
          </div>
        )}

        <section>
          <h4 className="font-serif font-bold text-lg text-spice-900 mb-3">Event details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <InfoTile icon="fa-gift" label="Occasion" value={res.eventType} />
            <InfoTile icon="fa-calendar-day" label="Date" value={formatDate(res.date)} />
            <InfoTile icon="fa-clock" label="Start time" value={formatTime(res.startTime)} />
            <InfoTile icon="fa-users" label="Guests" value={`${res.package.pax} pax`} />
            <InfoTile icon="fa-location-dot" label="Venue" value={res.venue} wide />
            <InfoTile icon="fa-palette" label="Theme / motif" value={res.theme || 'Not set'} />
            <InfoTile icon="fa-seedling" label="Centerpiece" value={res.centerpiece || 'Artificial Flowers'} />
            <InfoTile icon="fa-font" label="Styro name / standee" value={res.styroAvail ? res.styroName : 'Not availed'} wide />
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-3 mb-3">
            <h4 className="font-serif font-bold text-lg text-spice-900">Package & menu</h4>
            <p className="text-sm font-semibold text-spice-500">{res.package.name}</p>
          </div>
          {res.package.type === 'rental' ? (
            <div className="rounded-2xl border border-sand-200 bg-sand-50 p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-sand-200 text-spice-500 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-chair"></i>
              </div>
              <div>
                <p className="font-semibold text-spice-900">Equipment rental</p>
                <p className="text-sm text-spice-900/60 mt-0.5">Tables, chairs, and setup only. No food is included.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {courses.map((course) => (
                  <article key={course.key} className="rounded-2xl border border-sand-200 overflow-hidden bg-white">
                    <div className="h-24 bg-sand-100 overflow-hidden">
                      {course.img ? (
                        <img src={course.img} alt={course.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-spice-400"><i className={`fa-solid ${course.icon}`}></i></div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-spice-900/45">{course.label}</p>
                      <p className="text-xs font-semibold text-spice-900 leading-snug mt-0.5">{course.name}</p>
                    </div>
                  </article>
                ))}
              </div>
              <p className="text-xs text-spice-900/55 mt-3 flex items-center gap-2">
                <i className="fa-solid fa-utensils text-spice-400"></i>
                Also included: {res.menu?.staples || 'Rice, dessert, juice, mineral water'}
              </p>
            </>
          )}
        </section>

        <section>
          <div className="flex items-end justify-between gap-3 mb-3">
            <h4 className="font-serif font-bold text-lg text-spice-900">Payment</h4>
            <p className="font-serif text-2xl font-bold text-spice-500 leading-none">₱{p.toLocaleString()}</p>
          </div>
          <div className="h-1.5 rounded-full bg-sand-200 overflow-hidden mb-3">
            <div className="h-full bg-spice-500 rounded-full" style={{ width: `${(paidSteps / 3) * 100}%` }}></div>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <PayStep label="20% Fee" amount={fee} paid={!!res.payments.fee} />
            <PayStep label="30% Down" amount={down} paid={!!res.payments.down} />
            <PayStep label="50% Bal" amount={bal} paid={!!res.payments.bal} />
          </div>

          {(res.paymentProofs || []).length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {(res.paymentProofs || []).map((proof) => (
                <li key={proof.id} className="flex items-center gap-2 text-xs text-spice-900/70">
                  <i className="fa-solid fa-receipt text-spice-400"></i>
                  {PAYMENT_LABEL[proof.paymentType] || proof.paymentType}: {proof.status}
                  {proof.referenceNo ? ` · Ref ${proof.referenceNo}` : ''}
                </li>
              ))}
            </ul>
          )}
          {pending && (
            <div className="mt-3">
              <Banner tone="warn" icon="fa-hourglass-half">Your {PAYMENT_LABEL[nextType]} proof is waiting for owner verification.</Banner>
            </div>
          )}
          {canUpload && (
            <form onSubmit={uploadProof} className="mt-4 space-y-3">
              <p className="text-sm font-semibold text-spice-900">Upload {PAYMENT_LABEL[nextType]} proof</p>
              <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sand-300 bg-sand-50 px-4 py-6 text-center cursor-pointer hover:border-spice-400 hover:bg-spice-50/40 transition-colors">
                <div className="w-10 h-10 rounded-full bg-white border border-sand-200 text-spice-500 flex items-center justify-center">
                  <i className="fa-solid fa-upload"></i>
                </div>
                <span className="text-sm font-semibold text-spice-900">{file ? file.name : 'Tap to choose a file'}</span>
                <span className="text-xs text-spice-900/50">JPG, PNG, WebP, or PDF</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="sr-only"
                />
              </label>
              <Field label="Reference no. (optional)">
                <input className="input-modern" placeholder="GCash / bank reference" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
              </Field>
              <button type="submit" className="btn-primary w-full" disabled={!file || uploading}>{uploading ? 'Uploading…' : 'Submit proof'}</button>
            </form>
          )}
        </section>
      </div>

      <div className="ui-dialog-foot">
        <button type="button" onClick={() => printReceipt(res)} className="btn-secondary flex-1">
          <i className="fa-solid fa-print"></i> Print receipt
        </button>
        {canCancel && (
          <button type="button" onClick={promptCancel} className="btn-danger flex-1">
            <i className="fa-solid fa-ban"></i> Cancel booking
          </button>
        )}
      </div>
    </ModalShell>
  );
}
