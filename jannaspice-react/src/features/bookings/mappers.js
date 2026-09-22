function formatTime(value) {
  if (!value) return '';
  return String(value).slice(0, 5);
}

function mapMessage(row) {
  const createdAt = row.created_at || row.createdAt || null;
  return {
    id: row.id,
    sender: row.sender,
    text: row.body ?? row.text ?? '',
    timestamp: row.timestamp || (createdAt
      ? new Date(createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : ''),
    createdAt,
    attachmentPath: row.attachmentPath || row.attachment_path || null,
    attachmentName: row.attachmentName || row.attachment_name || null,
    attachmentMime: row.attachmentMime || row.attachment_mime || null,
    attachmentSize: row.attachmentSize ?? row.attachment_size ?? null
  };
}

function mapProof(row) {
  return {
    id: row.id,
    paymentType: row.paymentType || row.payment_type,
    amount: Number(row.amount || 0),
    referenceNo: row.referenceNo || row.reference_no || '',
    storagePath: row.storagePath || row.storage_path,
    status: row.status,
    note: row.note || '',
    createdAt: row.createdAt || row.created_at,
    reviewedAt: row.reviewedAt || row.reviewed_at || null
  };
}

export function mapReservation(row) {
  const messages = (Array.isArray(row.messages)
    ? row.messages.map(mapMessage)
    : Array.isArray(row.reservation_messages)
      ? row.reservation_messages.map(mapMessage)
      : []
  ).sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (ta !== tb) return ta - tb;
    return Number(a.id) - Number(b.id);
  });

  const proofs = Array.isArray(row.paymentProofs)
    ? row.paymentProofs.map(mapProof)
    : Array.isArray(row.payment_proofs)
      ? row.payment_proofs.map(mapProof)
      : [];

  const pkg = row.package || row.package_snapshot || {};
  if (pkg.price != null) pkg.price = Number(pkg.price);

  return {
    id: Number(row.id),
    userId: row.userId || row.user_id,
    name: row.name || row.contact_name,
    phone: row.phone || row.contact_phone,
    email: row.email || row.contact_email,
    eventTitle: row.eventTitle || row.event_title,
    eventType: row.eventType || row.event_type,
    date: row.date || row.event_date,
    startTime: row.startTime || formatTime(row.start_time),
    venue: row.venue,
    theme: row.theme,
    centerpiece: row.centerpiece,
    styroAvail: row.styroAvail ?? row.styro_avail,
    styroName: row.styroName || row.styro_name,
    package: pkg,
    menu: row.menu,
    status: row.status,
    payments: row.payments || {
      fee: !!row.payment_fee,
      down: !!row.payment_down,
      bal: !!row.payment_bal
    },
    changeRequest: row.changeRequest || row.change_request || null,
    cancelRequest: row.cancelRequest || row.cancel_request || null,
    paymentDueAt: row.paymentDueAt || row.payment_due_at || null,
    expiredReason: row.expiredReason || row.expired_reason || null,
    paymentProofs: proofs,
    messages
  };
}

export function toCreateArgs(payload) {
  return {
    p_contact_name: payload.name,
    p_contact_phone: payload.phone,
    p_contact_email: payload.email,
    p_event_title: payload.eventTitle,
    p_event_type: payload.eventType,
    p_event_date: payload.date,
    p_start_time: payload.startTime,
    p_venue: payload.venue,
    p_theme: payload.theme,
    p_centerpiece: payload.centerpiece,
    p_styro_avail: payload.styroAvail,
    p_styro_name: payload.styroName,
    p_package_id: payload.package.id,
    p_menu: payload.menu
  };
}
