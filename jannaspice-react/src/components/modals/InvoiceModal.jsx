import { ModalHeader, ModalShell } from '../ui/index.jsx';
import { buildReceiptHtml, printReceipt } from '../../utils/printReceipt.js';

export default function InvoiceModal({ open, reservation, onClose }) {
  if (!open || !reservation) return null;

  const html = buildReceiptHtml(reservation);

  return (
    <ModalShell open onClose={onClose} size="xl" labelledBy="invoice-title" flush>
      <ModalHeader
        id="invoice-title"
        title="Invoice PDF"
        subtitle={`#RES-${reservation.id} · ${reservation.eventTitle}`}
        onClose={onClose}
      />
      <div className="ui-dialog-body !bg-sand-50 !py-4">
        <div
          className="bg-white rounded-xl border border-sand-200 shadow-sm overflow-hidden"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <div className="ui-dialog-foot">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Close</button>
        <button type="button" onClick={() => printReceipt(reservation)} className="btn-primary flex-1">
          <i className="fa-solid fa-print"></i> Print / Save PDF
        </button>
      </div>
    </ModalShell>
  );
}
