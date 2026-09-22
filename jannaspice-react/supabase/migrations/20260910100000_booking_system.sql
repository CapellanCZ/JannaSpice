-- JannaSpice booking system: schema, RLS, RPCs, catalog seed.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.today_ph()
RETURNS date
LANGUAGE sql
STABLE
AS $$
  SELECT (timezone('Asia/Manila', now()))::date;
$$;

CREATE TABLE public.business_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  max_events_per_day integer NOT NULL DEFAULT 2,
  reservation_fee_pct numeric(5,2) NOT NULL DEFAULT 0.20,
  downpayment_pct numeric(5,2) NOT NULL DEFAULT 0.30,
  prep_lead_time_days integer NOT NULL DEFAULT 7
);

INSERT INTO public.business_settings (id) VALUES (1);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'manager')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE public.packages (
  id integer PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('rental', 'promo')),
  name text NOT NULL,
  pax integer NOT NULL,
  price numeric(12,2) NOT NULL,
  description text NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

INSERT INTO public.packages (id, type, name, pax, price, description) VALUES
  (1, 'rental', 'Equipment Rental Only', 50, 10000, 'Includes tables, chairs, basic backdrop, and complete catering equipment. Food NOT included.'),
  (2, 'promo', 'Promo Package (50 Pax)', 50, 30000, 'Complete basic setup, equipment, waiters, and full menu for 50 guests.'),
  (3, 'promo', 'Promo Package (75 Pax)', 75, 38000, 'Complete basic setup, equipment, waiters, and full menu for 75 guests.'),
  (4, 'promo', 'Promo Package (100 Pax)', 100, 46000, 'Complete basic setup, equipment, waiters, and full menu for 100 guests.');

CREATE TABLE public.reservations (
  id bigint GENERATED ALWAYS AS IDENTITY (START WITH 1000) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  contact_email text NOT NULL,
  event_title text NOT NULL,
  event_type text NOT NULL,
  event_date date NOT NULL,
  start_time time NOT NULL,
  venue text NOT NULL,
  theme text NOT NULL DEFAULT 'N/A',
  centerpiece text NOT NULL DEFAULT 'Artificial Flowers',
  styro_avail boolean NOT NULL DEFAULT false,
  styro_name text NOT NULL DEFAULT 'N/A',
  package_id integer NOT NULL REFERENCES public.packages (id),
  package_snapshot jsonb NOT NULL,
  menu jsonb,
  status text NOT NULL DEFAULT 'Pending' CHECK (
    status IN ('Pending', 'Approved', 'Reserved', 'DownpaymentVerified', 'FullyPaid', 'Cancelled')
  ),
  payment_fee boolean NOT NULL DEFAULT false,
  payment_down boolean NOT NULL DEFAULT false,
  payment_bal boolean NOT NULL DEFAULT false,
  change_request jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reservations_user_id_idx ON public.reservations (user_id);
CREATE INDEX reservations_event_date_idx ON public.reservations (event_date);
CREATE INDEX reservations_status_idx ON public.reservations (status);
CREATE INDEX reservations_active_date_idx ON public.reservations (event_date)
  WHERE status <> 'Cancelled';

CREATE TRIGGER reservations_set_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TABLE public.reservation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id bigint NOT NULL REFERENCES public.reservations (id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('client', 'manager')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reservation_messages_reservation_id_idx
  ON public.reservation_messages (reservation_id, created_at);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  body text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_id_idx ON public.notifications (user_id, created_at DESC);

CREATE TABLE public.blackout_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blackout_dates_range CHECK (end_date >= start_date)
);

CREATE INDEX blackout_dates_range_idx ON public.blackout_dates (start_date, end_date);

CREATE OR REPLACE FUNCTION private.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'manager'
  );
$$;

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'client'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

CREATE OR REPLACE FUNCTION private.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Role cannot be changed from the client';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_protect_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.protect_profile_role();

CREATE OR REPLACE FUNCTION private.notify_user(p_user_id uuid, p_body text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, body)
  VALUES (p_user_id, p_body);
END;
$$;

CREATE OR REPLACE FUNCTION private.date_is_blacked_out(p_date date)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.blackout_dates
    WHERE p_date BETWEEN start_date AND end_date
  );
$$;

CREATE OR REPLACE FUNCTION private.active_booking_count(p_date date, p_exclude_id bigint DEFAULT NULL)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.reservations
  WHERE event_date = p_date
    AND status <> 'Cancelled'
    AND (p_exclude_id IS NULL OR id <> p_exclude_id);
$$;

CREATE OR REPLACE FUNCTION private.assert_date_bookable(p_date date, p_exclude_id bigint DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings public.business_settings%ROWTYPE;
  booked integer;
BEGIN
  SELECT * INTO settings FROM public.business_settings WHERE id = 1;

  IF p_date < private.today_ph() + settings.prep_lead_time_days THEN
    RAISE EXCEPTION 'Lead time of % days is required', settings.prep_lead_time_days;
  END IF;

  IF private.date_is_blacked_out(p_date) THEN
    RAISE EXCEPTION 'Date is fully booked or unavailable';
  END IF;

  booked := private.active_booking_count(p_date, p_exclude_id);
  IF booked >= settings.max_events_per_day THEN
    RAISE EXCEPTION 'Date is no longer available';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.reservation_to_json(p_id bigint)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', r.id,
    'userId', r.user_id,
    'name', r.contact_name,
    'phone', r.contact_phone,
    'email', r.contact_email,
    'eventTitle', r.event_title,
    'eventType', r.event_type,
    'date', r.event_date,
    'startTime', to_char(r.start_time, 'HH24:MI'),
    'venue', r.venue,
    'theme', r.theme,
    'centerpiece', r.centerpiece,
    'styroAvail', r.styro_avail,
    'styroName', r.styro_name,
    'package', r.package_snapshot,
    'menu', r.menu,
    'status', r.status,
    'payments', jsonb_build_object(
      'fee', r.payment_fee,
      'down', r.payment_down,
      'bal', r.payment_bal
    ),
    'changeRequest', r.change_request,
    'messages', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'sender', m.sender,
          'text', m.body,
          'timestamp', to_char(timezone('Asia/Manila', m.created_at), 'HH12:MI AM')
        )
        ORDER BY m.created_at
      )
      FROM public.reservation_messages m
      WHERE m.reservation_id = r.id
    ), '[]'::jsonb)
  )
  FROM public.reservations r
  WHERE r.id = p_id;
$$;

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
  p_menu jsonb
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
    centerpiece, styro_avail, styro_name, package_id, package_snapshot, menu, status
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
    'Pending'
  )
  RETURNING id INTO new_id;

  PERFORM private.notify_user(
    uid,
    format('Booking #RES-%s (%s) submitted successfully! Status: Pending', new_id, trim(p_event_title))
  );

  RETURN private.reservation_to_json(new_id);
END;
$$;

CREATE OR REPLACE FUNCTION private.submit_change_request(p_reservation_id bigint, p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.reservations%ROWTYPE;
  next_date date;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO rec FROM public.reservations WHERE id = p_reservation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found';
  END IF;

  IF rec.user_id <> auth.uid() AND NOT private.is_manager() THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  IF rec.status = 'Cancelled' THEN
    RAISE EXCEPTION 'Cannot change a cancelled booking';
  END IF;

  next_date := coalesce((p_data->>'date')::date, rec.event_date);
  PERFORM private.assert_date_bookable(next_date, rec.id);

  UPDATE public.reservations
  SET change_request = jsonb_build_object(
    'status', 'Pending',
    'data', p_data,
    'timestamp', to_char(timezone('Asia/Manila', now()), 'MM/DD/YYYY')
  )
  WHERE id = rec.id;

  PERFORM private.notify_user(
    rec.user_id,
    format('Change request submitted for #RES-%s (%s)', rec.id, rec.event_title)
  );

  RETURN private.reservation_to_json(rec.id);
END;
$$;

CREATE OR REPLACE FUNCTION private.apply_change_payload(p_id bigint, p_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pkg public.packages%ROWTYPE;
  snapshot jsonb;
  pkg_id integer;
BEGIN
  pkg_id := coalesce((p_data->'package'->>'id')::integer, (p_data->>'package_id')::integer);
  IF pkg_id IS NOT NULL THEN
    SELECT * INTO pkg FROM public.packages WHERE id = pkg_id;
    IF FOUND THEN
      snapshot := jsonb_build_object(
        'id', pkg.id,
        'type', pkg.type,
        'name', pkg.name,
        'pax', pkg.pax,
        'price', pkg.price,
        'desc', pkg.description
      );
    END IF;
  END IF;

  UPDATE public.reservations
  SET
    contact_name = coalesce(p_data->>'name', contact_name),
    contact_phone = coalesce(p_data->>'phone', contact_phone),
    contact_email = coalesce(p_data->>'email', contact_email),
    event_title = coalesce(p_data->>'eventTitle', event_title),
    event_type = coalesce(p_data->>'eventType', event_type),
    event_date = coalesce((p_data->>'date')::date, event_date),
    start_time = coalesce((p_data->>'startTime')::time, start_time),
    venue = coalesce(p_data->>'venue', venue),
    theme = coalesce(p_data->>'theme', theme),
    centerpiece = coalesce(p_data->>'centerpiece', centerpiece),
    styro_avail = coalesce((p_data->>'styroAvail')::boolean, styro_avail),
    styro_name = coalesce(p_data->>'styroName', styro_name),
    package_id = coalesce(pkg_id, package_id),
    package_snapshot = coalesce(snapshot, package_snapshot),
    menu = CASE WHEN p_data ? 'menu' THEN p_data->'menu' ELSE menu END
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.approve_change_request(p_reservation_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.reservations%ROWTYPE;
  payload jsonb;
  next_date date;
BEGIN
  IF NOT private.is_manager() THEN
    RAISE EXCEPTION 'Manager access required';
  END IF;

  SELECT * INTO rec FROM public.reservations WHERE id = p_reservation_id;
  IF NOT FOUND OR rec.change_request IS NULL THEN
    RAISE EXCEPTION 'No change request to approve';
  END IF;

  payload := rec.change_request->'data';
  next_date := coalesce((payload->>'date')::date, rec.event_date);
  PERFORM private.assert_date_bookable(next_date, rec.id);
  PERFORM private.apply_change_payload(rec.id, payload);

  UPDATE public.reservations
  SET change_request = jsonb_set(change_request, '{status}', '"Approved"')
  WHERE id = rec.id;

  PERFORM private.notify_user(
    rec.user_id,
    format('Your change request for #RES-%s has been Approved by owner!', rec.id)
  );

  RETURN private.reservation_to_json(rec.id);
END;
$$;

CREATE OR REPLACE FUNCTION private.reject_change_request(p_reservation_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.reservations%ROWTYPE;
BEGIN
  IF NOT private.is_manager() THEN
    RAISE EXCEPTION 'Manager access required';
  END IF;

  SELECT * INTO rec FROM public.reservations WHERE id = p_reservation_id;
  IF NOT FOUND OR rec.change_request IS NULL THEN
    RAISE EXCEPTION 'No change request to reject';
  END IF;

  UPDATE public.reservations
  SET change_request = jsonb_set(change_request, '{status}', '"Rejected"')
  WHERE id = rec.id;

  PERFORM private.notify_user(
    rec.user_id,
    format('Your change request for #RES-%s was rejected by owner.', rec.id)
  );

  RETURN private.reservation_to_json(rec.id);
END;
$$;

CREATE OR REPLACE FUNCTION private.update_reservation_status(p_reservation_id bigint, p_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.reservations%ROWTYPE;
BEGIN
  IF NOT private.is_manager() THEN
    RAISE EXCEPTION 'Manager access required';
  END IF;

  IF p_status NOT IN ('Pending', 'Approved', 'Reserved', 'DownpaymentVerified', 'FullyPaid', 'Cancelled') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT * INTO rec FROM public.reservations WHERE id = p_reservation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found';
  END IF;

  UPDATE public.reservations SET status = p_status WHERE id = rec.id;

  PERFORM private.notify_user(
    rec.user_id,
    format('Booking #RES-%s status updated to: %s', rec.id, p_status)
  );

  RETURN private.reservation_to_json(rec.id);
END;
$$;

CREATE OR REPLACE FUNCTION private.cancel_reservation(p_reservation_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN private.update_reservation_status(p_reservation_id, 'Cancelled');
END;
$$;

CREATE OR REPLACE FUNCTION private.log_payment(p_reservation_id bigint, p_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.reservations%ROWTYPE;
  next_status text;
BEGIN
  IF NOT private.is_manager() THEN
    RAISE EXCEPTION 'Manager access required';
  END IF;

  IF p_type NOT IN ('fee', 'down', 'bal') THEN
    RAISE EXCEPTION 'Invalid payment type';
  END IF;

  SELECT * INTO rec FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found';
  END IF;

  IF rec.status = 'Cancelled' THEN
    RAISE EXCEPTION 'Cannot log payment on a cancelled booking';
  END IF;

  IF p_type = 'fee' THEN
    IF rec.status = 'Pending' THEN
      RAISE EXCEPTION 'Approve the booking before logging the reservation fee';
    END IF;
    rec.payment_fee := true;
    next_status := 'Reserved';
  ELSIF p_type = 'down' THEN
    IF NOT rec.payment_fee THEN
      RAISE EXCEPTION 'Log the reservation fee first';
    END IF;
    rec.payment_down := true;
    next_status := 'DownpaymentVerified';
  ELSE
    IF NOT rec.payment_down THEN
      RAISE EXCEPTION 'Log the downpayment first';
    END IF;
    rec.payment_bal := true;
    next_status := 'FullyPaid';
  END IF;

  UPDATE public.reservations
  SET
    payment_fee = rec.payment_fee,
    payment_down = rec.payment_down,
    payment_bal = rec.payment_bal,
    status = next_status
  WHERE id = rec.id;

  PERFORM private.notify_user(
    rec.user_id,
    format('Payment update for #RES-%s: Status is now %s', rec.id, next_status)
  );

  RETURN private.reservation_to_json(rec.id);
END;
$$;

CREATE OR REPLACE FUNCTION private.send_reservation_message(p_reservation_id bigint, p_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.reservations%ROWTYPE;
  sender_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF coalesce(trim(p_text), '') = '' THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;

  SELECT * INTO rec FROM public.reservations WHERE id = p_reservation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found';
  END IF;

  IF private.is_manager() THEN
    sender_role := 'manager';
  ELSIF rec.user_id = auth.uid() THEN
    sender_role := 'client';
  ELSE
    RAISE EXCEPTION 'Not allowed';
  END IF;

  INSERT INTO public.reservation_messages (reservation_id, sender, body)
  VALUES (rec.id, sender_role, trim(p_text));

  IF sender_role = 'manager' THEN
    PERFORM private.notify_user(
      rec.user_id,
      format('New message on booking #RES-%s', rec.id)
    );
  END IF;

  RETURN private.reservation_to_json(rec.id);
END;
$$;

CREATE OR REPLACE FUNCTION private.check_date_availability(p_date date, p_exclude_reservation_id bigint DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings public.business_settings%ROWTYPE;
  booked integer;
  remaining integer;
BEGIN
  SELECT * INTO settings FROM public.business_settings WHERE id = 1;
  booked := private.active_booking_count(p_date, p_exclude_reservation_id);

  IF p_date < private.today_ph() + settings.prep_lead_time_days THEN
    RETURN jsonb_build_object(
      'available', false,
      'remaining', 0,
      'reason', format('We require at least %s days lead time for preparation.', settings.prep_lead_time_days)
    );
  END IF;

  IF private.date_is_blacked_out(p_date) THEN
    RETURN jsonb_build_object('available', false, 'remaining', 0, 'reason', 'Date is fully booked or unavailable.');
  END IF;

  remaining := settings.max_events_per_day - booked;
  IF remaining <= 0 THEN
    RETURN jsonb_build_object('available', false, 'remaining', 0, 'reason', 'Date is fully booked or unavailable.');
  END IF;

  RETURN jsonb_build_object('available', true, 'remaining', remaining, 'reason', null);
END;
$$;

CREATE OR REPLACE FUNCTION private.add_blackout(p_start date, p_end date, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  end_d date;
BEGIN
  IF NOT private.is_manager() THEN
    RAISE EXCEPTION 'Manager access required';
  END IF;

  IF p_start IS NULL OR coalesce(trim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'Start date and reason are required';
  END IF;

  end_d := coalesce(p_end, p_start);
  IF end_d < p_start THEN
    RAISE EXCEPTION 'End date must be on or after the start date';
  END IF;

  INSERT INTO public.blackout_dates (start_date, end_date, reason, created_by)
  VALUES (p_start, end_d, trim(p_reason), auth.uid())
  RETURNING id INTO new_id;

  RETURN jsonb_build_object(
    'id', new_id,
    'start', p_start,
    'end', end_d,
    'reason', trim(p_reason)
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.delete_blackout(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT private.is_manager() THEN
    RAISE EXCEPTION 'Manager access required';
  END IF;

  DELETE FROM public.blackout_dates WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION private.mark_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.notifications
  SET is_read = true
  WHERE user_id = auth.uid() AND is_read = false;
END;
$$;

CREATE OR REPLACE FUNCTION private.clear_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.notifications WHERE user_id = auth.uid();
END;
$$;

-- Public RPC wrappers (PostgREST-exposed). Auth checks live in private.* .
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
  p_menu jsonb
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.create_reservation(
    p_contact_name, p_contact_phone, p_contact_email,
    p_event_title, p_event_type, p_event_date, p_start_time, p_venue, p_theme,
    p_centerpiece, p_styro_avail, p_styro_name, p_package_id, p_menu
  );
$$;

CREATE OR REPLACE FUNCTION public.submit_change_request(p_reservation_id bigint, p_data jsonb)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.submit_change_request(p_reservation_id, p_data);
$$;

CREATE OR REPLACE FUNCTION public.approve_change_request(p_reservation_id bigint)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.approve_change_request(p_reservation_id);
$$;

CREATE OR REPLACE FUNCTION public.reject_change_request(p_reservation_id bigint)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.reject_change_request(p_reservation_id);
$$;

CREATE OR REPLACE FUNCTION public.update_reservation_status(p_reservation_id bigint, p_status text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.update_reservation_status(p_reservation_id, p_status);
$$;

CREATE OR REPLACE FUNCTION public.cancel_reservation(p_reservation_id bigint)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.cancel_reservation(p_reservation_id);
$$;

CREATE OR REPLACE FUNCTION public.log_payment(p_reservation_id bigint, p_type text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.log_payment(p_reservation_id, p_type);
$$;

CREATE OR REPLACE FUNCTION public.send_reservation_message(p_reservation_id bigint, p_text text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.send_reservation_message(p_reservation_id, p_text);
$$;

CREATE OR REPLACE FUNCTION public.check_date_availability(p_date date, p_exclude_reservation_id bigint DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.check_date_availability(p_date, p_exclude_reservation_id);
$$;

CREATE OR REPLACE FUNCTION public.add_blackout(p_start date, p_end date, p_reason text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.add_blackout(p_start, p_end, p_reason);
$$;

CREATE OR REPLACE FUNCTION public.delete_blackout(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.delete_blackout(p_id);
$$;

CREATE OR REPLACE FUNCTION public.mark_notifications_read()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.mark_notifications_read();
$$;

CREATE OR REPLACE FUNCTION public.clear_notifications()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.clear_notifications();
$$;

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blackout_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_settings_read ON public.business_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY packages_read ON public.packages
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY profiles_select_own_or_manager ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR private.is_manager());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY reservations_select_own_or_manager ON public.reservations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.is_manager());

CREATE POLICY messages_select_own_or_manager ON public.reservation_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_id
        AND (r.user_id = auth.uid() OR private.is_manager())
    )
  );

CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.is_manager());

CREATE POLICY blackout_dates_select ON public.blackout_dates
  FOR SELECT TO anon, authenticated
  USING (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.business_settings TO anon, authenticated;
GRANT SELECT ON public.packages TO anon, authenticated;
GRANT SELECT ON public.blackout_dates TO anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.reservations TO authenticated;
GRANT SELECT ON public.reservation_messages TO authenticated;
GRANT SELECT ON public.notifications TO authenticated;

REVOKE ALL ON FUNCTION public.create_reservation(text, text, text, text, text, date, time, text, text, text, boolean, text, integer, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_change_request(bigint, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approve_change_request(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_change_request(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_reservation_status(bigint, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_reservation(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_payment(bigint, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.send_reservation_message(bigint, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_date_availability(date, bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_blackout(date, date, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_blackout(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_notifications_read() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.clear_notifications() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_reservation(text, text, text, text, text, date, time, text, text, text, boolean, text, integer, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_change_request(bigint, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_change_request(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_change_request(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_reservation_status(bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_reservation(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_payment(bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_reservation_message(bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_date_availability(date, bigint) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_blackout(date, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_blackout(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_notifications() TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blackout_dates;
