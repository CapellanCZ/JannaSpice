-- Brings two previously undocumented functions (queue_email, email_for_reservation) into
-- version control -- they existed live in Supabase but were never captured in a migration.
-- Also fixes a bug in email_for_reservation: its email bodies were built with plain '...'
-- string literals containing "\n", which Postgres does NOT interpret as a newline (only
-- E'...' escape-string literals do), so every queued email showed literal "\n" text instead
-- of real line breaks. Only the string-literal prefixes changed below (' -> E') -- no
-- template wording or logic was altered.

CREATE OR REPLACE FUNCTION private.queue_email(p_to text, p_subject text, p_body text, p_template text, p_reservation_id bigint DEFAULT NULL::bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF coalesce(trim(p_to), '') = '' THEN RETURN; END IF;
  INSERT INTO public.email_outbox (to_email, subject, body, template, reservation_id)
  VALUES (trim(p_to), p_subject, p_body, p_template, p_reservation_id);
END;
$function$;

CREATE OR REPLACE FUNCTION private.email_for_reservation(p_id bigint, p_template text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rec public.reservations%ROWTYPE;
  settings public.business_settings%ROWTYPE;
  subj text;
  body text;
  due_txt text;
BEGIN
  SELECT * INTO rec FROM public.reservations WHERE id = p_id;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT * INTO settings FROM public.business_settings WHERE id = 1;

  IF p_template = 'booking_submitted' THEN
    subj := format('JannaSpice: booking #RES-%s received', rec.id);
    body := format(E'Hi %s,\n\nWe received your booking for "%s" on %s at %s.\nVenue: %s\nStatus: Pending owner review.\n\nThank you,\nJannaSpice Cuisine', rec.contact_name, rec.event_title, rec.event_date, to_char(rec.start_time, 'HH24:MI'), rec.venue);
  ELSIF p_template = 'booking_approved' THEN
    due_txt := CASE WHEN rec.payment_due_at IS NOT NULL THEN to_char(timezone('Asia/Manila', rec.payment_due_at), 'YYYY-MM-DD HH12:MI AM') ELSE (settings.payment_due_hours::text || ' hours') END;
    subj := format('JannaSpice: booking #RES-%s approved — pay reservation fee', rec.id);
    body := format(E'Hi %s,\n\nYour booking #RES-%s ("%s") is approved.\nPlease upload proof of the 20%% reservation fee before %s (Asia/Manila). Unpaid bookings are released after this deadline.\n\nThank you,\nJannaSpice Cuisine', rec.contact_name, rec.id, rec.event_title, due_txt);
  ELSIF p_template = 'payment_verified' THEN
    subj := format('JannaSpice: payment verified for #RES-%s', rec.id);
    body := format(E'Hi %s,\n\nA payment for booking #RES-%s ("%s") has been verified. Current status: %s.\n\nThank you,\nJannaSpice Cuisine', rec.contact_name, rec.id, rec.event_title, rec.status);
  ELSIF p_template = 'booking_cancelled' THEN
    subj := format('JannaSpice: booking #RES-%s cancelled', rec.id);
    body := format(E'Hi %s,\n\nBooking #RES-%s ("%s" on %s) is now Cancelled. The date slot has been released.\n\nThank you,\nJannaSpice Cuisine', rec.contact_name, rec.id, rec.event_title, rec.event_date);
  ELSIF p_template = 'cancel_requested' THEN
    subj := format('JannaSpice: cancellation requested for #RES-%s', rec.id);
    body := format(E'Hi %s,\n\nWe received your cancellation request for #RES-%s ("%s"). The owner will confirm it shortly. Policy: %s\n\nThank you,\nJannaSpice Cuisine', rec.contact_name, rec.id, rec.event_title, coalesce(rec.cancel_request->'policy'->>'label', 'see dashboard'));
  ELSE
    RETURN;
  END IF;

  PERFORM private.queue_email(rec.contact_email, subj, body, p_template, rec.id);
END;
$function$;
