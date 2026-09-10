import { supabase } from '../../lib/supabase/client.js';
import { getErrorMessage } from '../../lib/supabase/errors.js';

export async function checkDateAvailability(date, excludeReservationId = null) {
  const { data, error } = await supabase.rpc('check_date_availability', {
    p_date: date,
    p_exclude_reservation_id: excludeReservationId
  });
  if (error) throw new Error(getErrorMessage(error, 'Could not check availability.'));
  return data;
}
