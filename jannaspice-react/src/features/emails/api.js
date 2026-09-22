import { supabase } from '../../lib/supabase/client.js';

export async function dispatchEmails() {
  try {
    await supabase.functions.invoke('dispatch-emails');
  } catch {
    // In-app notifications still work if the outbox worker is offline.
  }
}
