-- Chat attachments: images / files on reservation messages

ALTER TABLE public.reservation_messages
  ADD COLUMN IF NOT EXISTS attachment_path text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_mime text,
  ADD COLUMN IF NOT EXISTS attachment_size integer;

ALTER TABLE public.reservation_messages
  ALTER COLUMN body SET DEFAULT '';

ALTER TABLE public.reservation_messages
  DROP CONSTRAINT IF EXISTS reservation_messages_body_or_attachment_chk;

ALTER TABLE public.reservation_messages
  ADD CONSTRAINT reservation_messages_body_or_attachment_chk
  CHECK (
    length(trim(coalesce(body, ''))) > 0
    OR (attachment_path IS NOT NULL AND length(trim(attachment_path)) > 0)
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,
  8388608,
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS chat_attachments_insert ON storage.objects;
CREATE POLICY chat_attachments_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND split_part(name, '/', 1) ~ '^[0-9]+$'
    AND (
      private.is_manager()
      OR EXISTS (
        SELECT 1
        FROM public.reservations r
        WHERE r.id = split_part(name, '/', 1)::bigint
          AND r.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS chat_attachments_select ON storage.objects;
CREATE POLICY chat_attachments_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND split_part(name, '/', 1) ~ '^[0-9]+$'
    AND (
      private.is_manager()
      OR EXISTS (
        SELECT 1
        FROM public.reservations r
        WHERE r.id = split_part(name, '/', 1)::bigint
          AND r.user_id = auth.uid()
      )
    )
  );

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
    'startTime', r.start_time,
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
    'paymentDueAt', r.payment_due_at,
    'cancelRequest', r.cancel_request,
    'messages', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'sender', m.sender,
          'text', m.body,
          'timestamp', to_char(timezone('Asia/Manila', m.created_at), 'HH12:MI AM'),
          'createdAt', m.created_at,
          'attachmentPath', m.attachment_path,
          'attachmentName', m.attachment_name,
          'attachmentMime', m.attachment_mime,
          'attachmentSize', m.attachment_size
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

DROP FUNCTION IF EXISTS public.send_reservation_message(bigint, text);
DROP FUNCTION IF EXISTS private.send_reservation_message(bigint, text);

CREATE OR REPLACE FUNCTION private.send_reservation_message(
  p_reservation_id bigint,
  p_text text DEFAULT '',
  p_attachment_path text DEFAULT NULL,
  p_attachment_name text DEFAULT NULL,
  p_attachment_mime text DEFAULT NULL,
  p_attachment_size integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.reservations%ROWTYPE;
  sender_role text;
  body_text text := trim(coalesce(p_text, ''));
  att_path text := nullif(trim(coalesce(p_attachment_path, '')), '');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF body_text = '' AND att_path IS NULL THEN
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

  IF att_path IS NOT NULL AND split_part(att_path, '/', 1) <> rec.id::text THEN
    RAISE EXCEPTION 'Invalid attachment path';
  END IF;

  INSERT INTO public.reservation_messages (
    reservation_id,
    sender,
    body,
    attachment_path,
    attachment_name,
    attachment_mime,
    attachment_size
  )
  VALUES (
    rec.id,
    sender_role,
    body_text,
    att_path,
    CASE WHEN att_path IS NULL THEN NULL ELSE nullif(trim(coalesce(p_attachment_name, '')), '') END,
    CASE WHEN att_path IS NULL THEN NULL ELSE nullif(trim(coalesce(p_attachment_mime, '')), '') END,
    CASE WHEN att_path IS NULL THEN NULL ELSE p_attachment_size END
  );

  IF sender_role = 'manager' THEN
    PERFORM private.notify_user(
      rec.user_id,
      format('New message on booking #RES-%s', rec.id)
    );
  END IF;

  RETURN private.reservation_to_json(rec.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.send_reservation_message(
  p_reservation_id bigint,
  p_text text DEFAULT '',
  p_attachment_path text DEFAULT NULL,
  p_attachment_name text DEFAULT NULL,
  p_attachment_mime text DEFAULT NULL,
  p_attachment_size integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.send_reservation_message(
    p_reservation_id,
    p_text,
    p_attachment_path,
    p_attachment_name,
    p_attachment_mime,
    p_attachment_size
  );
$$;

REVOKE ALL ON FUNCTION public.send_reservation_message(bigint, text, text, text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_reservation_message(bigint, text, text, text, text, integer) TO authenticated;
