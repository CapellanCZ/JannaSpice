// Sends queued rows from public.email_outbox via Resend, then marks each row
// sent/failed. Invoked by the client after mutations (see src/features/emails/api.js)
// and safe to call repeatedly — it only ever touches status = 'queued' rows.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY is not configured' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );

  const { data: rows, error: fetchError } = await supabase
    .from('email_outbox')
    .select('id, to_email, subject, body')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(25);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  let sent = 0;
  let failed = 0;

  for (const row of rows || []) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: row.to_email,
          subject: row.subject,
          text: row.body,
        }),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`Resend ${res.status}: ${detail}`);
      }

      await supabase
        .from('email_outbox')
        .update({ status: 'sent', sent_at: new Date().toISOString(), error: null })
        .eq('id', row.id);
      sent++;
    } catch (err) {
      await supabase
        .from('email_outbox')
        .update({ status: 'failed', error: String(err?.message || err) })
        .eq('id', row.id);
      failed++;
    }
  }

  return new Response(JSON.stringify({ processed: (rows || []).length, sent, failed }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
