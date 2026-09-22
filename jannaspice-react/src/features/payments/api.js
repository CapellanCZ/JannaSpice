import { supabase } from '../../lib/supabase/client.js';
import { getErrorMessage } from '../../lib/supabase/errors.js';
import { mapReservation } from '../bookings/mappers.js';

const BUCKET = 'payment-proofs';
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_BYTES = 5 * 1024 * 1024;

async function callRpc(fn, args) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(getErrorMessage(error));
  return data;
}

function safeFileName(file) {
  const raw = String(file?.name || 'proof');
  const cleaned = raw.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  return cleaned || 'proof';
}

export function nextPaymentType(reservation) {
  if (!reservation?.payments?.fee) return 'fee';
  if (!reservation.payments.down) return 'down';
  if (!reservation.payments.bal) return 'bal';
  return null;
}

export function pendingProofFor(reservation, paymentType) {
  return (reservation?.paymentProofs || []).find(
    (p) => p.paymentType === paymentType && p.status === 'pending'
  ) || null;
}

export async function uploadPaymentProof({ reservationId, userId, paymentType, file, referenceNo, amount }) {
  if (!file) throw new Error('Choose a photo or PDF of your payment proof.');
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Use a JPG, PNG, WEBP, or PDF file.');
  if (file.size > MAX_BYTES) throw new Error('File must be 5 MB or smaller.');

  const path = `${userId}/${reservationId}/${Date.now()}-${safeFileName(file)}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type
  });
  if (uploadError) throw new Error(getErrorMessage(uploadError, 'Could not upload proof.'));

  try {
    const data = await callRpc('submit_payment_proof', {
      p_reservation_id: reservationId,
      p_payment_type: paymentType,
      p_storage_path: path,
      p_reference_no: referenceNo || null,
      p_amount: amount ?? 0
    });
    return mapReservation(data);
  } catch (err) {
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    throw err;
  }
}

export async function reviewPaymentProof(proofId, decision, note) {
  const data = await callRpc('review_payment_proof', {
    p_proof_id: proofId,
    p_decision: decision,
    p_note: note || null
  });
  return mapReservation(data);
}

export async function getProofSignedUrl(storagePath) {
  if (!storagePath) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60 * 10);
  if (error) throw new Error(getErrorMessage(error, 'Could not open proof file.'));
  return data?.signedUrl || null;
}
