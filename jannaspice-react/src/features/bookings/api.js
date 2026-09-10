import { supabase } from '../../lib/supabase/client.js';
import { getErrorMessage } from '../../lib/supabase/errors.js';
import { mapReservation, toCreateArgs } from './mappers.js';

async function callRpc(fn, args) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(getErrorMessage(error));
  return data;
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

export async function sendMessage(reservationId, text) {
  const data = await callRpc('send_reservation_message', {
    p_reservation_id: reservationId,
    p_text: text
  });
  return mapReservation(data);
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
