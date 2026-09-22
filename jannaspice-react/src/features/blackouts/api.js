import { supabase } from '../../lib/supabase/client.js';
import { getErrorMessage } from '../../lib/supabase/errors.js';

function mapBlackout(row) {
  return {
    id: row.id,
    start: row.start || row.start_date,
    end: row.end || row.end_date,
    reason: row.reason
  };
}

export async function listBlackouts() {
  const { data, error } = await supabase
    .from('blackout_dates')
    .select('id, start_date, end_date, reason')
    .order('start_date', { ascending: true });
  if (error) throw new Error(getErrorMessage(error, 'Could not load blackout dates.'));
  return (data || []).map(mapBlackout);
}

export async function addBlackout({ start, end, reason }) {
  const { data, error } = await supabase.rpc('add_blackout', {
    p_start: start,
    p_end: end || start,
    p_reason: reason
  });
  if (error) throw new Error(getErrorMessage(error, 'Could not add blackout date.'));
  return mapBlackout(data);
}

export async function deleteBlackout(id) {
  const { error } = await supabase.rpc('delete_blackout', { p_id: id });
  if (error) throw new Error(getErrorMessage(error, 'Could not delete blackout date.'));
}
