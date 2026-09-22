import { supabase } from '../../lib/supabase/client.js';
import { getErrorMessage } from '../../lib/supabase/errors.js';
import { mapReservation, toCreateArgs } from './mappers.js';

const CHAT_BUCKET = 'chat-attachments';
const CHAT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const CHAT_MAX_BYTES = 8 * 1024 * 1024;

async function callRpc(fn, args) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(getErrorMessage(error));
  return data;
}

function safeFileName(file) {
  const raw = String(file?.name || 'file');
  const cleaned = raw.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  return cleaned || 'file';
}

export function isChatImage(mime) {
  return String(mime || '').startsWith('image/');
}

export async function getChatAttachmentUrl(storagePath) {
  if (!storagePath) return null;
  const { data, error } = await supabase.storage.from(CHAT_BUCKET).createSignedUrl(storagePath, 60 * 30);
  if (error) throw new Error(getErrorMessage(error, 'Could not open attachment.'));
  return data?.signedUrl || null;
}

export async function listReservations() {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, reservation_messages(*), payment_proofs(*)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(getErrorMessage(error, 'Could not load bookings.'));
  return (data || []).map(mapReservation);
}

export async function createReservation(payload) {
  const data = await callRpc('create_reservation', toCreateArgs(payload));
  return mapReservation(data);
}

export async function submitChangeRequest(reservationId, payload) {
  const data = await callRpc('submit_change_request', {
    p_reservation_id: reservationId,
    p_data: payload
  });
  return mapReservation(data);
}

export async function updateReservationStatus(reservationId, status) {
  const data = await callRpc('update_reservation_status', {
    p_reservation_id: reservationId,
    p_status: status
  });
  return mapReservation(data);
}

export async function cancelReservation(reservationId) {
  const data = await callRpc('cancel_reservation', { p_reservation_id: reservationId });
  return mapReservation(data);
}

export async function logPayment(reservationId, type) {
  const data = await callRpc('log_payment', {
    p_reservation_id: reservationId,
    p_type: type
  });
  return mapReservation(data);
}

export async function approveChangeRequest(reservationId) {
  const data = await callRpc('approve_change_request', { p_reservation_id: reservationId });
  return mapReservation(data);
}

export async function rejectChangeRequest(reservationId) {
  const data = await callRpc('reject_change_request', { p_reservation_id: reservationId });
  return mapReservation(data);
}

export async function sendMessage(reservationId, { text = '', file = null } = {}) {
  const body = String(text || '').trim();
  let attachmentPath = null;
  let attachmentName = null;
  let attachmentMime = null;
  let attachmentSize = null;

  if (file) {
    if (!CHAT_ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Use a JPG, PNG, WEBP, PDF, or Word file.');
    }
    if (file.size > CHAT_MAX_BYTES) {
      throw new Error('File must be 8 MB or smaller.');
    }

    attachmentPath = `${reservationId}/${Date.now()}-${safeFileName(file)}`;
    attachmentName = file.name || 'attachment';
    attachmentMime = file.type;
    attachmentSize = file.size;

    const { error: uploadError } = await supabase.storage.from(CHAT_BUCKET).upload(attachmentPath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });
    if (uploadError) throw new Error(getErrorMessage(uploadError, 'Could not upload file.'));
  }

  if (!body && !attachmentPath) {
    throw new Error('Type a message or attach a file.');
  }

  try {
    const data = await callRpc('send_reservation_message', {
      p_reservation_id: reservationId,
      p_text: body,
      p_attachment_path: attachmentPath,
      p_attachment_name: attachmentName,
      p_attachment_mime: attachmentMime,
      p_attachment_size: attachmentSize
    });
    return mapReservation(data);
  } catch (err) {
    if (attachmentPath) {
      await supabase.storage.from(CHAT_BUCKET).remove([attachmentPath]).catch(() => {});
    }
    throw err;
  }
}

export async function requestCancellation(reservationId) {
  const data = await callRpc('request_cancellation', { p_reservation_id: reservationId });
  return mapReservation(data);
}

export async function confirmCancellation(reservationId) {
  const data = await callRpc('confirm_cancellation', { p_reservation_id: reservationId });
  return mapReservation(data);
}

export async function rejectCancellation(reservationId, note) {
  const data = await callRpc('reject_cancellation', {
    p_reservation_id: reservationId,
    p_note: note || null
  });
  return mapReservation(data);
}

export async function expireUnpaidReservations() {
  const { error } = await supabase.rpc('expire_unpaid_reservations');
  if (error) throw new Error(getErrorMessage(error, 'Could not release unpaid slots.'));
}
