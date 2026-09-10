-- Cap active bookings at 2 per calendar day, with a race-safe lock and friendly errors.

UPDATE public.business_settings
SET max_events_per_day = 2
WHERE id = 1;

CREATE OR REPLACE FUNCTION private.assert_date_bookable(p_date date, p_exclude_id bigint DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings public.business_settings%ROWTYPE;
  booked integer;
  cap integer;
BEGIN
  PERFORM pg_advisory_xact_lock(871001, hashtext(p_date::text));

  SELECT * INTO settings FROM public.business_settings WHERE id = 1;
  cap := coalesce(settings.max_events_per_day, 2);

  IF p_date < private.today_ph() + settings.prep_lead_time_days THEN
    RAISE EXCEPTION 'We need at least % days to prepare. Please pick a later date.', settings.prep_lead_time_days;
  END IF;

  IF private.date_is_blacked_out(p_date) THEN
    RAISE EXCEPTION 'That date is set aside and not open for bookings. Please choose another day.';
  END IF;

  booked := private.active_booking_count(p_date, p_exclude_id);
  IF booked >= cap THEN
    RAISE EXCEPTION 'This date is fully booked. JannaSpice only takes 2 events per day so every celebration gets our full attention. Please pick another day.';
  END IF;
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
  cap integer;
BEGIN
  SELECT * INTO settings FROM public.business_settings WHERE id = 1;
  cap := coalesce(settings.max_events_per_day, 2);
  booked := private.active_booking_count(p_date, p_exclude_reservation_id);

  IF p_date < private.today_ph() + settings.prep_lead_time_days THEN
    RETURN jsonb_build_object(
      'available', false,
      'remaining', 0,
      'reason', format('We need at least %s days to prepare. Please pick a later date.', settings.prep_lead_time_days)
    );
  END IF;

  IF private.date_is_blacked_out(p_date) THEN
    RETURN jsonb_build_object(
      'available', false,
      'remaining', 0,
      'reason', 'That date is set aside and not open for bookings. Please choose another day.'
    );
  END IF;

  remaining := cap - booked;
  IF remaining <= 0 THEN
    RETURN jsonb_build_object(
      'available', false,
      'remaining', 0,
      'reason', 'This date is fully booked. JannaSpice only takes 2 events per day so every celebration gets our full attention. Please pick another day.'
    );
  END IF;

  RETURN jsonb_build_object(
    'available', true,
    'remaining', remaining,
    'reason', CASE
      WHEN remaining = 1 THEN 'This date is still open — 1 of 2 spots left.'
      ELSE format('This date is open — %s of %s spots left.', remaining, cap)
    END
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.enforce_daily_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cap integer;
  booked integer;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'Cancelled' THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'Cancelled' THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(871001, hashtext(NEW.event_date::text));

  SELECT coalesce(max_events_per_day, 2) INTO cap FROM public.business_settings WHERE id = 1;
  booked := private.active_booking_count(NEW.event_date, NEW.id);

  IF booked >= cap THEN
    RAISE EXCEPTION 'This date is fully booked. JannaSpice only takes 2 events per day so every celebration gets our full attention. Please pick another day.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reservations_daily_capacity ON public.reservations;
CREATE TRIGGER reservations_daily_capacity
  BEFORE INSERT OR UPDATE OF event_date, status
  ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_daily_capacity();
