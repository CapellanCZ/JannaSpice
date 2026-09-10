import { Banner, StatusBadge } from '../ui/index.jsx';
import InvoiceDropdown from './InvoiceDropdown.jsx';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-PH', {
    weekday: 'long',
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

export default function BookingSummaryCard({
  reservation: r,
  onDetails,
  onMessages,
  onRequestChanges,
  onViewInvoice
}) {
  const msgCount = r.messages?.length || 0;
  const steps = [
    { key: 'fee', short: 'Fee', label: 'Fee', paid: !!r.payments?.fee },
    { key: 'down', short: 'Down', label: 'Down', paid: !!r.payments?.down },
    { key: 'bal', short: 'Bal', label: 'Balance', paid: !!r.payments?.bal }
  ];
  const paidCount = steps.filter((s) => s.paid).length;
  const paymentLabel = paidCount === 3
    ? 'Fully paid'
    : paidCount === 0
      ? 'No payments yet'
      : `${paidCount} of 3 paid`;

  return (
    <article className="bg-white rounded-[20px] border border-sand-200/80 shadow-[0_1px_2px_rgba(45,40,37,0.04)] overflow-hidden">
      <div className="p-6 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h3 className="font-serif text-[22px] leading-tight font-bold text-spice-900 tracking-tight">
                {r.eventTitle}
              </h3>
              <StatusBadge status={r.status} />
            </div>

            <p className="mt-2 text-[13px] text-spice-900/40 font-medium tracking-wide">
              RES-{r.id}
              {r.eventType ? ` · ${r.eventType}` : ''}
            </p>

            {(r.changeRequest?.status === 'Pending' || r.cancelRequest?.status === 'pending') && (
              <div className="mt-3 flex flex-wrap gap-2">
                {r.changeRequest?.status === 'Pending' && <span className="status-badge badge-down">Change pending</span>}
                {r.cancelRequest?.status === 'pending' && <span className="status-badge badge-cancelled">Cancel pending</span>}
              </div>
            )}

            <div className="mt-5 space-y-2.5">
              <div className="flex items-center gap-3 text-[15px] text-spice-900">
                <i className="fa-regular fa-calendar text-spice-400 w-4 text-center text-sm"></i>
                <span>
                  <span className="font-medium">{formatDate(r.date)}</span>
                  <span className="text-spice-900/35 mx-2">·</span>
                  <span className="text-spice-900/70">{formatTime(r.startTime)}</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-[15px] text-spice-900/70">
                <i className="fa-solid fa-location-dot text-spice-400 w-4 text-center text-sm"></i>
                <span className="truncate">{r.venue}</span>
              </div>
              <div className="flex items-center gap-3 text-[15px] text-spice-900/70">
                <i className="fa-solid fa-bell-concierge text-spice-400 w-4 text-center text-sm"></i>
                <span className="truncate">{r.package?.name}</span>
              </div>
            </div>
          </div>

          <div className="sm:w-[148px] shrink-0 sm:pl-6 sm:border-l sm:border-sand-100 sm:text-right">
            <p className="text-[28px] leading-none font-semibold text-spice-900 tracking-tight tabular-nums">
              <span className="text-lg font-medium text-spice-900/35 align-top mr-0.5">₱</span>
              {(r.package?.price || 0).toLocaleString()}
            </p>
            <p className="mt-2 text-[12px] text-spice-900/40">{paymentLabel}</p>
            <div className="mt-3 sm:ml-auto sm:w-[132px] space-y-1.5">
              <div className="flex gap-1">
                {steps.map((step) => (
                  <div
                    key={step.key}
                    className={`h-1 flex-1 rounded-full ${step.paid ? 'bg-spice-500' : 'bg-sand-200'}`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-medium tracking-wide">
                {steps.map((step) => (
                  <span
                    key={`${step.key}-label`}
                    className={step.paid ? 'text-spice-500' : 'text-spice-900/35'}
                  >
                    {step.short}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {r.status === 'Approved' && r.paymentDueAt && !r.payments?.fee && (
          <div className="mt-5">
            <Banner tone="info" icon="fa-clock">
              Fee due {new Date(r.paymentDueAt).toLocaleString('en-PH', {
                timeZone: 'Asia/Manila',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </Banner>
          </div>
        )}
      </div>

      <div className="px-6 sm:px-7 py-3.5 bg-sand-50/60 border-t border-sand-100 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onDetails} className="btn-primary btn-sm">Details</button>
        <button type="button" onClick={onMessages} className="btn-secondary btn-sm">
          Messages
          {msgCount > 0 && (
            <span className="bg-spice-500 text-white rounded-full min-w-[1.15rem] h-[1.15rem] px-1 flex items-center justify-center text-[10px] font-bold">
              {msgCount}
            </span>
          )}
        </button>
        <InvoiceDropdown reservation={r} onView={onViewInvoice} />
        {r.status !== 'Cancelled' && (
          <button type="button" onClick={onRequestChanges} className="btn-secondary btn-sm">
            <i className="fa-solid fa-pen text-[10px]"></i>
            Request changes
          </button>
        )}
      </div>
    </article>
  );
}
