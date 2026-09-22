import { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { PAYMENT_ACCOUNT } from '../../features/payments/index.js';
import { printReceipt } from '../../utils/printReceipt.js';
import { Banner, Field, IconButton, ModalShell, StatusBadge } from '../ui/index.jsx';
import {
  EventDetailsGrid,
  PAYMENT_LABEL,
  PackageMenuSection,
  PaymentInstructions,
  PaymentOverview,
  formatDueAt
} from '../booking/BookingDetailViews.jsx';

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
  const fileInputRef = useRef(null);

  if (!clientDetailModal.open || !res) return null;

  const p = res.package.price;
  const fee = p * CONFIG.reservationFeePct, down = p * CONFIG.downpaymentPct, bal = p - fee - down;
  const nextType = nextPaymentType(res);
  const pending = nextType ? pendingProofFor(res, nextType) : null;
  const canUpload = res.status !== 'Cancelled' && res.status !== 'Pending' && nextType && !pending;
  const canCancel = res.status !== 'Cancelled' && res.cancelRequest?.status !== 'pending';

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

        <section>
          <h4 className="font-serif font-bold text-lg text-spice-900 mb-3">Event details</h4>
          <EventDetailsGrid res={res} />
        </section>

        <PackageMenuSection res={res} menuOptions={menuOptions} />

        <PaymentOverview price={p} fee={fee} down={down} bal={bal} payments={res.payments} />

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
              <PaymentInstructions account={PAYMENT_ACCOUNT} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sand-300 bg-sand-50 px-4 py-6 text-center hover:border-spice-400 hover:bg-spice-50/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-white border border-sand-200 text-spice-500 flex items-center justify-center">
                  <i className="fa-solid fa-upload"></i>
                </div>
                <span className="text-sm font-semibold text-spice-900 break-all px-2">{file ? file.name : 'Tap to choose a file'}</span>
                <span className="text-xs text-spice-900/50">JPG, PNG, WebP, or PDF</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                tabIndex={-1}
              />
              <Field label="Reference no. (optional)">
                <input className="input-modern" placeholder="GCash / bank reference" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
              </Field>
              <button type="submit" className="btn-primary w-full" disabled={!file || uploading}>{uploading ? 'Uploading…' : 'Submit proof'}</button>
            </form>
          )}
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
