-- Ops layer: settings, proofs, audit, emails, menu catalog, storage.

ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS payment_due_hours integer NOT NULL DEFAULT 48,
  ADD COLUMN IF NOT EXISTS cancel_free_days integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS cancel_partial_days integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS cancel_partial_retain_pct numeric(5,2) NOT NULL DEFAULT 0.50;

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS payment_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_request jsonb,
  ADD COLUMN IF NOT EXISTS expired_reason text,
  ADD COLUMN IF NOT EXISTS client_request_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS reservations_client_request_id_uidx
  ON public.reservations (client_request_id)
  WHERE client_request_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id bigint NOT NULL REFERENCES public.reservations (id) ON DELETE CASCADE,
  payment_type text NOT NULL CHECK (payment_type IN ('fee', 'down', 'bal')),
  amount numeric(12,2) NOT NULL DEFAULT 0,
  reference_no text,
  storage_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  note text,
  submitted_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_proofs_reservation_idx ON public.payment_proofs (reservation_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS payment_proofs_one_pending_uidx
  ON public.payment_proofs (reservation_id, payment_type)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON public.audit_log (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON public.audit_log (actor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  template text NOT NULL,
  reservation_id bigint REFERENCES public.reservations (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'logged')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS email_outbox_queued_idx ON public.email_outbox (status, created_at) WHERE status = 'queued';

CREATE TABLE IF NOT EXISTS public.menu_items (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category text NOT NULL CHECK (category IN ('chicken', 'beefPork', 'fishSeafood', 'veg', 'pasta')),
  name text NOT NULL,
  subcategory text,
  image_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (category, name)
);

INSERT INTO public.menu_items (category, name, subcategory, image_url, sort_order) VALUES
  ('chicken', 'Fried chicken', NULL, 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=400&q=80', 1),
  ('chicken', 'Breaded chicken fillet', NULL, 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=400&q=80', 2),
  ('chicken', 'Cordon bleu', NULL, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80', 3),
  ('chicken', 'Chicken caldereta', NULL, 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=400&q=80', 4),
  ('chicken', 'Afritada', NULL, 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&q=80', 5),
  ('chicken', 'Chicken pastel', NULL, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80', 6),
  ('chicken', 'Chicken lollipop', NULL, 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=400&q=80', 7),
  ('chicken', 'Hawaiian chicken', NULL, 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=400&q=80', 8),
  ('chicken', 'Chicken teriyaki', NULL, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80', 9),
  ('beefPork', 'Beef with mushroom', 'Beef', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80', 1),
  ('beefPork', 'Beef broccoli', 'Beef', 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=400&q=80', 2),
  ('beefPork', 'Caldereta (Beef/Pork)', 'Beef/Pork', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80', 3),
  ('beefPork', 'Kare kare', 'Beef', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80', 4),
  ('beefPork', 'Roast beef', 'Beef', 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=400&q=80', 5),
  ('beefPork', 'Breaded porkchop', 'Pork', 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=400&q=80', 6),
  ('beefPork', 'Hamonado', 'Pork', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80', 7),
  ('beefPork', 'Lechon kawali', 'Pork', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80', 8),
  ('beefPork', 'Special sisig', 'Pork', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80', 9),
  ('fishSeafood', 'Breaded fish fillet', 'Fish', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80', 1),
  ('fishSeafood', 'Sweet & sour fillet', 'Fish', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80', 2),
  ('fishSeafood', 'Relyenong bangus', 'Fish', 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=400&q=80', 3),
  ('fishSeafood', 'Prawns in garlic', 'Seafood', 'https://images.unsplash.com/photo-1559742811-822873691df8?auto=format&fit=crop&w=800&q=80', 4),
  ('fishSeafood', 'Tempura', 'Seafood', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80', 5),
  ('fishSeafood', 'Calamares', 'Seafood', 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=400&q=80', 6),
  ('veg', 'Creamy mix vegetable', NULL, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80', 1),
  ('veg', 'Chopsuey', NULL, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80', 2),
  ('veg', 'Vegetable tempura', NULL, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80', 3),
  ('veg', 'Garden salad with dressing', NULL, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80', 4),
  ('pasta', 'Spaghetti', NULL, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400&q=80', 1),
  ('pasta', 'Carbonara', NULL, 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=400&q=80', 2),
  ('pasta', 'Baked Macaroni', NULL, 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=400&q=80', 3)
ON CONFLICT (category, name) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;
