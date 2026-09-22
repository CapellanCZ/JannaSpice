import { supabase } from '../../lib/supabase/client.js';

export async function touchSession(sessionId, source, referralCode) {
  const { error } = await supabase.rpc('touch_session', {
    p_session_id: sessionId,
    p_source: source || null,
    p_referral_code: referralCode || null
  });
  if (error) throw new Error(error.message || 'Could not record session.');
}

export async function logEvent(sessionId, eventType, payload = {}) {
  const { error } = await supabase.rpc('log_event', {
    p_session_id: sessionId,
    p_event_type: eventType,
    p_payload: payload
  });
  if (error) throw new Error(error.message || 'Could not log event.');
}
