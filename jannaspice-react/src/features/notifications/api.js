import { supabase } from '../../lib/supabase/client.js';
import { getErrorMessage } from '../../lib/supabase/errors.js';

export function mapNotification(row, email) {
  const createdAt = row.created_at;
  return {
    id: row.id,
    userId: row.user_id,
    email,
    text: row.body,
    time: new Date(createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    createdAt,
    read: row.is_read
  };
}

export async function listNotifications(email) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, body, is_read, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(getErrorMessage(error, 'Could not load notifications.'));
  return (data || []).map((row) => mapNotification(row, email));
}

export async function markNotificationsRead() {
  const { error } = await supabase.rpc('mark_notifications_read');
  if (error) throw new Error(getErrorMessage(error, 'Could not mark notifications read.'));
}

export async function clearNotifications() {
  const { error } = await supabase.rpc('clear_notifications');
  if (error) throw new Error(getErrorMessage(error, 'Could not clear notifications.'));
}
