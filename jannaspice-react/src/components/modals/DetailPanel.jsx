import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { printReceipt } from '../../utils/printReceipt.js';
import { countUnreadFromOther } from '../../utils/chatUnread.js';
import { Banner, IconButton, StatusBadge } from '../ui/index.jsx';
import {
  EventDetailsGrid,
  InfoTile,
  PAYMENT_LABEL,
  PackageMenuSection,
  PaymentOverview,
  formatDate,
  formatDueAt,
  formatTime
} from '../booking/BookingDetailViews.jsx';

function isPdfPath(path = '') {
  return String(path).toLowerCase().endsWith('.pdf');
}

function latestProofFor(proofs, paymentType) {
  const list = (proofs || []).filter((p) => p.paymentType === paymentType);
  if (!list.length) return null;
  const rank = { pending: 2, verified: 1, rejected: 0 };
  return [...list].sort((a, b) => {
    const r = (rank[b.status] || 0) - (rank[a.status] || 0);
    if (r !== 0) return r;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  })[0];
}

function ProofThumb({ proof, getProofSignedUrl, onOpen }) {
  const [url, setUrl] = useState(null);
  const pdf = isPdfPath(proof.storagePath);

  useEffect(() => {
    let alive = true;
    if (!proof.storagePath || pdf) return undefined;
    getProofSignedUrl(proof.storagePath)
      .then((signed) => { if (alive) setUrl(signed); })
      .catch(() => { if (alive) setUrl(null); });
    return () => { alive = false; };
  }, [proof.storagePath, pdf, getProofSignedUrl]);

  return (
    <button
      type="button"
      onClick={() => onOpen(proof)}
      className="w-14 h-14 rounded-xl overflow-hidden border border-sand-200 bg-sand-50 shrink-0 hover:border-spice-300"
      aria-label="Open payment proof"
    >
      {url && !pdf ? (
        <img src={url} alt="Payment proof" className="w-full h-full object-cover" />
      ) : (
        <span className="w-full h-full flex items-center justify-center text-spice-400">
          <i className={`fa-solid ${pdf ? 'fa-file-pdf' : 'fa-image'}`}></i>
        </span>
      )}
    </button>
  );
}

function MilestoneRow({ index, title, hint, done, action, locked, proof, getProofSignedUrl, onOpenProof }) {
  return (
    <div className={`rounded-2xl border px-4 py-3.5 ${
      done ? 'bg-emerald-50/70 border-emerald-100' : 'bg-white border-sand-200'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          done ? 'bg-emerald-500 text-white' : locked ? 'bg-sand-100 text-spice-900/30' : 'bg-spice-500 text-white'
        }`}>
          {done ? <i className="fa-solid fa-check text-[10px]"></i> : index}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-spice-900">{title}</p>
          {hint ? <p className="text-xs text-spice-900/45 mt-0.5">{hint}</p> : null}
        </div>
        {done ? (
          <span className="text-[11px] font-semibold text-emerald-700">Done</span>
        ) : action}
      </div>
      {proof && (
        <div className="mt-3 ml-11 flex items-center gap-3">
          <ProofThumb proof={proof} getProofSignedUrl={getProofSignedUrl} onOpen={onOpenProof} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider font-bold text-spice-900/40">
              {proof.status === 'pending' ? 'Proof submitted' : proof.status === 'verified' ? 'Verified proof' : 'Proof'}
            </p>
            <p className="text-sm font-semibold text-spice-900 truncate mt-0.5">
              {proof.referenceNo ? `Ref ${proof.referenceNo}` : 'No reference no.'}
            </p>
            <button type="button" onClick={() => onOpenProof(proof)} className="text-xs font-semibold text-spice-500 hover:underline mt-0.5">
              View screenshot
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DetailPanel() {
  const {
    detailPanel, closeDetail, reservationsQueue, CONFIG, updateReservationStatus,
    logPayment, cancelReservation, approveChangeRequest, rejectChangeRequest,
    customAlert, openChat, reviewPaymentProof, getProofSignedUrl,
    confirmCancellation, rejectCancellation, menuOptions, chatReadVersion
  } = useApp();
  void chatReadVersion;

  const res = detailPanel.resId ? reservationsQueue.find((r) => r.id === detailPanel.resId) : null;

  if (!res) {
    return (
      <>
        <div className={`ui-drawer-overlay ${detailPanel.open ? '' : 'hidden'}`} onClick={closeDetail}></div>
        <aside className={`ui-drawer transform transition-transform duration-300 ${detailPanel.open ? 'translate-x-0' : 'translate-x-full'}`}></aside>
      </>
    );
  }

  const p = res.package.price;
  const fee = p * CONFIG.reservationFeePct;
  const down = p * CONFIG.downpaymentPct;
  const bal = p - fee - down;
  const approved = res.status !== 'Pending' && res.status !== 'Cancelled';
  const cancelled = res.status === 'Cancelled';
  const unread = countUnreadFromOther(res.id, res.messages || [], 'manager');
  const proofs = res.paymentProofs || [];
  const pendingProofs = proofs.filter((proof) => proof.status === 'pending');
  const change = res.changeRequest;
  const feeProof = latestProofFor(proofs, 'fee');
  const downProof = latestProofFor(proofs, 'down');
  const balProof = latestProofFor(proofs, 'bal');

  function hasScreenshot(proof) {
    return !!proof && proof.status !== 'rejected' && !!proof.storagePath;
  }

  function promptCancel() {
    customAlert(
      'This booking will be cancelled and the date will open up again.',
      'Are you sure?',
      'confirm',
      (confirmed) => {
        if (!confirmed) return;
        cancelReservation(res.id);
        closeDetail();
        customAlert('Booking has been cancelled.', 'Cancelled', 'success');
      },
      { confirmLabel: 'Yes, cancel booking', confirmDanger: true }
    );
  }

  function promptLogPaid(type, label, amount) {
    customAlert(
      `Log ₱${amount.toLocaleString()} as paid for ${label}? Make sure the screenshot and reference look correct.`,
      'Are you sure?',
      'confirm',
      (confirmed) => {
        if (!confirmed) return;
        logPayment(res.id, type);
      },
      { confirmLabel: 'Yes, log paid', confirmDanger: false }
    );
  }

  async function openProof(proof) {
    try {
      const url = await getProofSignedUrl(proof.storagePath);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      customAlert(err.message, 'Error', 'error');
    }
  }

  return (
    <>
      <div className={`ui-drawer-overlay ${detailPanel.open ? '' : 'hidden'}`} onClick={closeDetail}></div>
      <aside className={`ui-drawer transform transition-transform duration-300 ${detailPanel.open ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="px-5 pt-5 pb-4 pr-14 border-b border-sand-200 shrink-0 bg-white">
          <p className="text-[11px] font-semibold text-spice-900/45">Reservation #RES-{res.id}</p>
          <h3 className="font-serif font-bold text-2xl text-spice-900 leading-tight mt-1">{res.eventTitle}</h3>
          <div className="mt-2.5"><StatusBadge status={res.status} /></div>
          <IconButton onClick={closeDetail} label="Close" className="dialog-close" />
        </header>

        <div className="p-5 space-y-6 overflow-y-auto min-h-0 flex-1">
          {change?.status === 'Pending' && (
            <Banner tone="warn" icon="fa-triangle-exclamation">
              <p className="font-semibold mb-2">Client asked to change this booking</p>
              <div className="space-y-1 text-xs mb-3">
                <p><span className="text-spice-900/50">Title</span> · {change.data.eventTitle}</p>
                <p><span className="text-spice-900/50">When</span> · {formatDate(change.data.date)} · {formatTime(change.data.startTime)}</p>
                <p><span className="text-spice-900/50">Venue</span> · {change.data.venue}</p>
                <p><span className="text-spice-900/50">Package</span> · {change.data.package?.name}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => approveChangeRequest(res.id)} className="btn-primary btn-sm">Approve</button>
                <button type="button" onClick={() => rejectChangeRequest(res.id)} className="btn-danger btn-sm">Reject</button>
              </div>
            </Banner>
          )}

          {res.cancelRequest?.status === 'pending' && (
            <Banner tone="warn" icon="fa-ban">
              <p className="font-semibold mb-1">Cancellation requested</p>
              <p className="mb-3">{res.cancelRequest.policy?.label}. {res.cancelRequest.policy?.refund_note}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => confirmCancellation(res.id)} className="btn-danger btn-sm">Confirm cancel</button>
                <button type="button" onClick={() => rejectCancellation(res.id)} className="btn-secondary btn-sm">Keep booking</button>
              </div>
            </Banner>
          )}

          {res.status === 'Approved' && res.paymentDueAt && !res.payments.fee && (
            <Banner tone="info" icon="fa-clock">
              Fee due {formatDueAt(res.paymentDueAt)}. Unpaid bookings auto-release.
            </Banner>
          )}

          {res.expiredReason === 'unpaid_deadline' && (
            <Banner tone="danger" icon="fa-circle-xmark">
              Cancelled automatically because the reservation fee was not paid on time.
            </Banner>
          )}

          {pendingProofs.map((proof) => (
            <Banner key={proof.id} tone="accent" icon="fa-receipt">
              <p className="font-semibold mb-1">Proof waiting: {PAYMENT_LABEL[proof.paymentType] || proof.paymentType}</p>
              {proof.referenceNo ? <p className="mb-2 text-xs">Ref {proof.referenceNo}</p> : null}
              {proof.amount ? <p className="mb-2 text-xs">₱{Number(proof.amount).toLocaleString()}</p> : null}
              <div className="flex gap-2 flex-wrap">
                <button type="button" className="btn-secondary btn-sm" onClick={() => openProof(proof)}>View file</button>
                <button type="button" className="btn-primary btn-sm" onClick={() => reviewPaymentProof(proof.id, 'verified')}>Verify & log</button>
                <button type="button" className="btn-danger btn-sm" onClick={() => reviewPaymentProof(proof.id, 'rejected', 'Please upload a clearer proof.')}>Reject</button>
              </div>
            </Banner>
          ))}

          <section>
            <h4 className="font-serif font-bold text-lg text-spice-900 mb-3">Client</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <InfoTile icon="fa-user" label="Name" value={res.name} />
              <InfoTile icon="fa-phone" label="Mobile" value={res.phone} href={`tel:${res.phone}`} />
              <InfoTile icon="fa-envelope" label="Email" value={res.email} href={`mailto:${res.email}`} wide />
            </div>
          </section>

          <section>
            <h4 className="font-serif font-bold text-lg text-spice-900 mb-3">Event details</h4>
            <EventDetailsGrid res={res} />
          </section>

          <PackageMenuSection res={res} menuOptions={menuOptions} />

          <PaymentOverview price={p} fee={fee} down={down} bal={bal} payments={res.payments} />

          {proofs.length > 0 && (
            <ul className="space-y-1.5 -mt-2">
              {proofs.map((proof) => (
                <li key={proof.id} className="flex items-center gap-2 text-xs text-spice-900/70">
                  <i className="fa-solid fa-receipt text-spice-400"></i>
                  <span className="flex-1 min-w-0 truncate">
                    {PAYMENT_LABEL[proof.paymentType] || proof.paymentType}: {proof.status}
                    {proof.referenceNo ? ` · Ref ${proof.referenceNo}` : ''}
                  </span>
                  {proof.storagePath && (
                    <button type="button" className="text-spice-500 font-semibold hover:underline shrink-0" onClick={() => openProof(proof)}>
                      View
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <section>
            <h4 className="font-serif font-bold text-lg text-spice-900 mb-3">Workflow</h4>
            {cancelled ? (
              <Banner tone="danger" icon="fa-ban">This booking is cancelled.</Banner>
            ) : (
              <div className="space-y-2">
                <MilestoneRow
                  index={1}
                  title="Approve booking"
                  hint="Review logistics, then lock the date"
                  done={approved}
                  action={<button type="button" onClick={() => updateReservationStatus(res.id, 'Approved')} className="btn-primary btn-sm">Approve</button>}
                />
                <MilestoneRow
                  index={2}
                  title="20% reservation fee"
                  hint={`₱${fee.toLocaleString()}`}
                  done={!!res.payments.fee}
                  locked={!approved}
                  proof={feeProof}
                  getProofSignedUrl={getProofSignedUrl}
                  onOpenProof={openProof}
                  action={
                    <button
                      type="button"
                      onClick={() => promptLogPaid('fee', 'the 20% reservation fee', fee)}
                      disabled={!approved || !hasScreenshot(feeProof)}
                      className="btn-primary btn-sm"
                      title={!hasScreenshot(feeProof) ? 'Wait for a payment screenshot' : 'Log paid'}
                    >
                      Log paid
                    </button>
                  }
                />
                <MilestoneRow
                  index={3}
                  title="30% downpayment"
                  hint={hasScreenshot(downProof) || !!res.payments.down ? `₱${down.toLocaleString()}` : `₱${down.toLocaleString()} · waiting for screenshot`}
                  done={!!res.payments.down}
                  locked={!res.payments.fee}
                  proof={downProof}
                  getProofSignedUrl={getProofSignedUrl}
                  onOpenProof={openProof}
                  action={
                    <button
                      type="button"
                      onClick={() => promptLogPaid('down', 'the 30% downpayment', down)}
                      disabled={!res.payments.fee || !hasScreenshot(downProof)}
                      className="btn-primary btn-sm"
                      title={!hasScreenshot(downProof) ? 'Wait for a payment screenshot' : 'Log paid'}
                    >
                      Log paid
                    </button>
                  }
                />
                <MilestoneRow
                  index={4}
                  title="50% balance"
                  hint={hasScreenshot(balProof) || !!res.payments.bal ? `₱${bal.toLocaleString()}` : `₱${bal.toLocaleString()} · waiting for screenshot`}
                  done={!!res.payments.bal}
                  locked={!res.payments.down}
                  proof={balProof}
                  getProofSignedUrl={getProofSignedUrl}
                  onOpenProof={openProof}
                  action={
                    <button
                      type="button"
                      onClick={() => promptLogPaid('bal', 'the 50% balance', bal)}
                      disabled={!res.payments.down || !hasScreenshot(balProof)}
                      className="btn-primary btn-sm"
                      title={!hasScreenshot(balProof) ? 'Wait for a payment screenshot' : 'Log paid'}
                    >
                      Log paid
                    </button>
                  }
                />
              </div>
            )}
          </section>
        </div>

        <footer className="ui-dialog-foot">
          <button type="button" onClick={() => openChat(res.id, 'manager')} className="btn-secondary flex-1">
            <i className="fa-regular fa-comments"></i>
            Messages
            {unread > 0 && (
              <span className="bg-spice-500 text-white rounded-full min-w-[1.15rem] h-[1.15rem] px-1 flex items-center justify-center text-[10px] font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          <button type="button" onClick={() => printReceipt(res)} className="btn-secondary flex-1">
            <i className="fa-solid fa-print"></i> Print
          </button>
          {!cancelled && (
            <button type="button" onClick={promptCancel} className="btn-danger flex-1">
              <i className="fa-solid fa-ban"></i> Cancel
            </button>
          )}
        </footer>
      </aside>
    </>
  );
}
