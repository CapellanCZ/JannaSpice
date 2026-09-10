import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Banner, Field, StatusBadge } from '../ui/index.jsx';

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

export default function BookingCard({ reservation: res, onMessages, onRequestChanges, onViewInvoice }) {
  const {
    CONFIG, currentUser, submitPaymentProof, requestCancellation, customAlert,
    nextPaymentType, pendingProofFor, menuOptions
  } = useApp();
  const [file, setFile] = useState(null);
  const [referenceNo, setReferenceNo] = useState('');
  const [uploading, setUploading] = useState(false);

  const p = res.package.price;
  const fee = p * CONFIG.reservationFeePct;
  const down = p * CONFIG.downpaymentPct;
  const bal = p - fee - down;
  const nextType = nextPaymentType(res);
  const pending = nextType ? pendingProofFor(res, nextType) : null;
  const canUpload = res.status !== 'Cancelled' && res.status !== 'Pending' && nextType && !pending;
  const canCancel = res.status !== 'Cancelled' && res.cancelRequest?.status !== 'pending';
  const paidSteps = [res.payments.fee, res.payments.down, res.payments.bal].filter(Boolean).length;
  const msgCount = res.messages ? res.messages.length : 0;

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
    <article className="surface-card overflow-hidden">
      <div className="p-5 lg:p-7 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h4 className="font-serif font-bold text-spice-900 text-xl">{res.eventTitle}</h4>
            <StatusBadge status={res.status} />
            <span className="text-xs text-spice-900/50 bg-sand-100 px-2 py-1 rounded-full font-medium">#RES-{res.id}</span>
            {res.changeRequest?.status === 'Pending' && <span className="status-badge badge-down">Change pending</span>}
            {res.cancelRequest?.status === 'pending' && <span className="status-badge badge-cancelled">Cancel pending</span>}
          </div>
          <div className="flex flex-col gap-1.5 mt-3">
            <p className="text-sm text-spice-900/70 flex items-center gap-2"><i className="fa-regular fa-calendar w-4 text-spice-400 text-center"></i> <strong className="text-spice-900">{res.date}</strong> at {res.startTime}</p>
            <p className="text-sm text-spice-900/70 flex items-center gap-2"><i className="fa-solid fa-location-dot w-4 text-spice-400 text-center"></i> {res.venue}</p>
            <p className="text-sm text-spice-900/70 flex items-center gap-2"><i className="fa-solid fa-bell-concierge w-4 text-spice-400 text-center"></i> {res.package?.name}</p>
          </div>
        </div>
        <div className="text-left md:text-right w-full md:w-auto bg-sand-50 md:bg-transparent p-4 md:p-0 rounded-xl border border-sand-200 md:border-none">
          <span className="block text-[10px] uppercase tracking-widest font-bold text-spice-900/50 mb-1">Total</span>
          <span className="font-serif font-bold text-spice-500 text-3xl block">₱{p.toLocaleString()}</span>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-spice-900/60">
            <div className={res.payments.fee ? 'text-emerald-600 font-bold' : ''}>Fee<br />{res.payments.fee ? <i className="fa-solid fa-check"></i> : '20%'}</div>
            <div className={res.payments.down ? 'text-emerald-600 font-bold' : ''}>Down<br />{res.payments.down ? <i className="fa-solid fa-check"></i> : '30%'}</div>
            <div className={res.payments.bal ? 'text-emerald-600 font-bold' : ''}>Bal<br />{res.payments.bal ? <i className="fa-solid fa-check"></i> : '50%'}</div>
          </div>
        </div>
      </div>

      <div className="px-5 lg:px-7 pb-6 space-y-5 border-t border-sand-100 pt-5">
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
          <div className="grid grid-cols-5 gap-1.5 rounded-2xl overflow-hidden h-24 sm:h-32">
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
          <div className="rounded-2xl overflow-hidden h-24 sm:h-32 bg-sand-100">
            <img src={SETUP_PHOTO} alt="Catering setup" className="w-full h-full object-cover" />
          </div>
        )}

        <section>
          <h5 className="font-serif font-bold text-base text-spice-900 mb-3">Event details</h5>
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
            <h5 className="font-serif font-bold text-base text-spice-900">Package & menu</h5>
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
                  <div key={course.key} className="rounded-2xl border border-sand-200 overflow-hidden bg-white">
                    <div className="h-20 bg-sand-100 overflow-hidden">
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
                  </div>
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
          <h5 className="font-serif font-bold text-base text-spice-900 mb-3">Payment</h5>
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
              <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sand-300 bg-sand-50 px-4 py-5 text-center cursor-pointer hover:border-spice-400 hover:bg-spice-50/40 transition-colors">
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
              <button type="submit" className="btn-primary btn-sm" disabled={!file || uploading}>{uploading ? 'Uploading…' : 'Submit proof'}</button>
            </form>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button type="button" onClick={onMessages} className="btn-secondary btn-sm">
            <i className="fa-regular fa-comments"></i> Messages
            {msgCount > 0 && <span className="bg-spice-500 text-white rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center text-[10px] font-bold">{msgCount}</span>}
          </button>
          {res.status !== 'Cancelled' && (
            <button type="button" onClick={onRequestChanges} className="btn-secondary btn-sm">
              <i className="fa-solid fa-pen"></i> Request changes
            </button>
          )}
          <button type="button" onClick={onViewInvoice} className="btn-primary btn-sm">
            <i className="fa-solid fa-file-lines"></i> View invoice
          </button>
          {canCancel && (
            <button type="button" onClick={promptCancel} className="btn-danger btn-sm">
              <i className="fa-solid fa-ban"></i> Cancel booking
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
