-- Wires attribution into create_reservation. attribution_source and referred_by are read
-- server-side from the visitor's visitor_sessions row (first-touch, never trusted as raw
-- client input); self_reported_source is the customer's own "how did you hear about us"
-- answer, which is legitimately client-supplied. Also records the authoritative
-- RESERVATION_SUBMITTED analytics event in the same transaction as the reservation insert,
-- per the earlier design principle: conversion tracking must not depend on the browser
-- staying open after the RPC call succeeds.
--
-- The old 14-argument create_reservation signatures are dropped and replaced (rather than
-- overloaded) because supabase-js calls RPCs with named JSON arguments; leaving both the old
-- and new signatures active would make PostgREST's overload resolution ambiguous.

DROP FUNCTION IF EXISTS public.create_reservation(text, text, text, text, text, date, time, text, text, text, boolean, text, integer, jsonb);
DROP FUNCTION IF EXISTS private.create_reservation(text, text, text, text, text, date, time, text, text, text, boolean, text, integer, jsonb);

CREATE OR REPLACE FUNCTION private.create_reservation(
  p_contact_name text,
  p_contact_phone text,
  p_contact_email text,
  p_event_title text,
  p_event_type text,
  p_event_date date,
  p_start_time time,
  p_venue text,
  p_theme text,
  p_centerpiece text,
  p_styro_avail boolean,
  p_styro_name text,
  p_package_id integer,
  p_menu jsonb,
  p_session_id uuid DEFAULT NULL,
  p_self_reported_source text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  pkg public.packages%ROWTYPE;
  snapshot jsonb;
  new_id bigint;
  sess public.visitor_sessions%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF coalesce(trim(p_event_title), '') = '' OR coalesce(trim(p_venue), '') = '' THEN
    RAISE EXCEPTION 'Event title and venue are required';
  END IF;

  SELECT * INTO pkg FROM public.packages WHERE id = p_package_id AND is_active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid package';
  END IF;

  IF pkg.type = 'promo' AND (
    p_menu IS NULL
    OR coalesce(p_menu->>'chicken', '') = ''
    OR coalesce(p_menu->>'beefPork', '') = ''
    OR coalesce(p_menu->>'fishSeafood', '') = ''
    OR coalesce(p_menu->>'veg', '') = ''
    OR coalesce(p_menu->>'pasta', '') = ''
  ) THEN
    RAISE EXCEPTION 'Please select all 5 dishes for a promo package';
  END IF;

  PERFORM private.assert_date_bookable(p_event_date, NULL);

  IF p_session_id IS NOT NULL THEN
    SELECT * INTO sess FROM public.visitor_sessions WHERE session_id = p_session_id;
  END IF;

  snapshot := jsonb_build_object(
    'id', pkg.id,
    'type', pkg.type,
    'name', pkg.name,
    'pax', pkg.pax,
    'price', pkg.price,
    'desc', pkg.description
  );

  INSERT INTO public.reservations (
    user_id, contact_name, contact_phone, contact_email,
    event_title, event_type, event_date, start_time, venue, theme,
    centerpiece, styro_avail, styro_name, package_id, package_snapshot, menu, status,
    attribution_source, self_reported_source, referred_by
  ) VALUES (
    uid,
    trim(p_contact_name),
    trim(p_contact_phone),
    trim(p_contact_email),
    trim(p_event_title),
    trim(p_event_type),
    p_event_date,
    p_start_time,
    trim(p_venue),
    coalesce(nullif(trim(p_theme), ''), 'N/A'),
    coalesce(nullif(p_centerpiece, ''), 'Artificial Flowers'),
    coalesce(p_styro_avail, false),
    CASE WHEN coalesce(p_styro_avail, false) THEN coalesce(nullif(trim(p_styro_name), ''), 'N/A') ELSE 'N/A' END,
    pkg.id,
    snapshot,
    CASE WHEN pkg.type = 'promo' THEN p_menu || jsonb_build_object('staples', 'Rice, Dessert, Juice, Mineral Water') ELSE NULL END,
    'Pending',
    sess.first_source,
    nullif(trim(coalesce(p_self_reported_source, '')), ''),
    sess.first_referral_code
  )
  RETURNING id INTO new_id;

  IF p_session_id IS NOT NULL THEN
    INSERT INTO public.analytics_events (session_id, user_id, event_type, reservation_id, package_id, source, metadata)
    VALUES (
      p_session_id, uid, 'RESERVATION_SUBMITTED', new_id, pkg.id, sess.first_source,
      jsonb_build_object('reservation_id', new_id, 'package_id', pkg.id)
    );
  END IF;

  PERFORM private.notify_user(
    uid,
    format('Booking #RES-%s (%s) submitted successfully! Status: Pending', new_id, trim(p_event_title))
  );

  RETURN private.reservation_to_json(new_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_reservation(
  p_contact_name text,
  p_contact_phone text,
  p_contact_email text,
  p_event_title text,
  p_event_type text,
  p_event_date date,
  p_start_time time,
  p_venue text,
  p_theme text,
  p_centerpiece text,
  p_styro_avail boolean,
  p_styro_name text,
  p_package_id integer,
  p_menu jsonb,
  p_session_id uuid DEFAULT NULL,
  p_self_reported_source text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.create_reservation(
    p_contact_name, p_contact_phone, p_contact_email,
    p_event_title, p_event_type, p_event_date, p_start_time, p_venue, p_theme,
    p_centerpiece, p_styro_avail, p_styro_name, p_package_id, p_menu,
    p_session_id, p_self_reported_source
  );
$$;

REVOKE ALL ON FUNCTION public.create_reservation(text, text, text, text, text, date, time, text, text, text, boolean, text, integer, jsonb, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_reservation(text, text, text, text, text, date, time, text, text, text, boolean, text, integer, jsonb, uuid, text) TO authenticated;
