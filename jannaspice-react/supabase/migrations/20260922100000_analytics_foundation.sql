-- Analytics foundation: visitor sessions, attribution, and event logging.
-- Additive only: no existing table, column, or function is modified or removed.

CREATE TABLE public.visitor_sessions (
  session_id uuid PRIMARY KEY,
  user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  first_source text,
  first_referral_code text,
  first_landed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX visitor_sessions_user_id_idx ON public.visitor_sessions (user_id);

CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.visitor_sessions (session_id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'PAGE_VIEW', 'PACKAGE_VIEW', 'PORTFOLIO_VIEW',
    'DATE_CHECK_STARTED', 'DATE_CHECK_COMPLETED',
    'RESERVATION_STARTED', 'RESERVATION_STEP_COMPLETED', 'RESERVATION_ABANDONED', 'RESERVATION_SUBMITTED',
    'RETURN_VISIT', 'REFERRAL_VISIT'
  )),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  reservation_id bigint REFERENCES public.reservations (id) ON DELETE SET NULL,
  package_id integer REFERENCES public.packages (id) ON DELETE SET NULL,
  source text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX analytics_events_session_idx ON public.analytics_events (session_id, occurred_at);
CREATE INDEX analytics_events_type_idx ON public.analytics_events (event_type, occurred_at);

-- Attribution columns on reservations. Kept separate per design: attribution_source is
-- auto-detected and first-touch (never overwritten), self_reported_source is the client's
-- own "how did you hear about us" answer, referred_by is an independent referral code.
-- Not yet populated by create_reservation — see follow-up note in the migration PR/chat.
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS attribution_source text,
  ADD COLUMN IF NOT EXISTS self_reported_source text,
  ADD COLUMN IF NOT EXISTS referred_by text;

-- touch_session: create-or-preserve first-touch attribution for a session. Never overwrites
-- first_source/first_referral_code once set. Attaches the current authenticated user (if any)
-- without ever trusting a client-supplied user id.
CREATE OR REPLACE FUNCTION private.touch_session(p_session_id uuid, p_source text, p_referral_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.visitor_sessions (session_id, user_id, first_source, first_referral_code)
  VALUES (p_session_id, auth.uid(), NULLIF(btrim(p_source), ''), NULLIF(btrim(p_referral_code), ''))
  ON CONFLICT (session_id) DO UPDATE
    SET user_id = COALESCE(public.visitor_sessions.user_id, EXCLUDED.user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_session(p_session_id uuid, p_source text DEFAULT NULL, p_referral_code text DEFAULT NULL)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.touch_session(p_session_id, p_source, p_referral_code);
$$;

-- log_event: the only sanctioned write path into analytics_events. Validates the event type
-- via the table's own CHECK constraint, caps payload size, and soft-throttles bursts from a
-- single session so an anonymous client can't flood the table.
CREATE OR REPLACE FUNCTION private.log_event(p_session_id uuid, p_event_type text, p_payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
  session_source text;
BEGIN
  IF pg_column_size(p_payload) > 4000 THEN
    RAISE EXCEPTION 'Event payload too large';
  END IF;

  SELECT count(*) INTO recent_count
  FROM public.analytics_events
  WHERE session_id = p_session_id
    AND occurred_at > now() - interval '1 minute';
  IF recent_count >= 60 THEN
    RETURN;
  END IF;

  SELECT first_source INTO session_source FROM public.visitor_sessions WHERE session_id = p_session_id;
  IF NOT FOUND THEN
    PERFORM private.touch_session(p_session_id, NULL, NULL);
    session_source := NULL;
  END IF;

  INSERT INTO public.analytics_events (session_id, user_id, event_type, reservation_id, package_id, source, metadata)
  VALUES (
    p_session_id,
    auth.uid(),
    p_event_type,
    NULLIF(p_payload->>'reservation_id', '')::bigint,
    NULLIF(p_payload->>'package_id', '')::integer,
    session_source,
    p_payload
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.log_event(p_session_id uuid, p_event_type text, p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.log_event(p_session_id, p_event_type, p_payload);
$$;

ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY visitor_sessions_manager_read ON public.visitor_sessions
  FOR SELECT TO authenticated
  USING (private.is_manager());

CREATE POLICY analytics_events_manager_read ON public.analytics_events
  FOR SELECT TO authenticated
  USING (private.is_manager());

GRANT SELECT ON public.visitor_sessions TO authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;

REVOKE ALL ON FUNCTION public.touch_session(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_event(uuid, text, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.touch_session(uuid, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_event(uuid, text, jsonb) TO anon, authenticated;
