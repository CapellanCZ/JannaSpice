-- After owner approval, bookings become Reserved (no separate Approved status).

CREATE OR REPLACE FUNCTION private.update_reservation_status(p_reservation_id bigint, p_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.reservations%ROWTYPE;
  settings public.business_settings%ROWTYPE;
  next_status text := p_status;
  hours integer := 48;
BEGIN
  IF NOT private.is_manager() THEN
    RAISE EXCEPTION 'Manager access required';
  END IF;

  IF next_status = 'Approved' THEN
    next_status := 'Reserved';
  END IF;

  IF next_status NOT IN ('Pending', 'Reserved', 'DownpaymentVerified', 'FullyPaid', 'Cancelled') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT * INTO rec FROM public.reservations WHERE id = p_reservation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found';
  END IF;

  SELECT * INTO settings FROM public.business_settings WHERE id = 1;
  hours := 48;
  IF settings.payment_due_hours IS NOT NULL THEN
    hours := settings.payment_due_hours;
  END IF;

  UPDATE public.reservations
  SET
    status = next_status,
    payment_due_at = CASE
      WHEN rec.status = 'Pending' AND next_status = 'Reserved' AND payment_due_at IS NULL
        THEN now() + make_interval(hours => hours)
      ELSE payment_due_at
    END
  WHERE id = rec.id;

  PERFORM private.notify_user(
    rec.user_id,
    CASE
      WHEN rec.status = 'Pending' AND next_status = 'Reserved' THEN
        format('Your booking #RES-%s is now Reserved. Please pay the reservation fee within %s hours.', rec.id, hours)
      ELSE
        format('Booking #RES-%s status updated to: %s', rec.id, next_status)
    END
  );

  RETURN private.reservation_to_json(rec.id);
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
      RAISE EXCEPTION 'Reserve the booking before logging the reservation fee';
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

UPDATE public.reservations
SET status = 'Reserved'
WHERE status = 'Approved';
