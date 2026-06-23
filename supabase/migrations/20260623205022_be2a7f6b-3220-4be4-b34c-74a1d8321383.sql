-- 1. Set immutable search_path on email queue functions
ALTER FUNCTION public.enqueue_email(queue_name text, payload jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(queue_name text, message_id bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb) SET search_path = public, pgmq;

-- 2. Lock down SECURITY DEFINER function execution

-- Internal / trigger / edge-only functions: not callable by clients at all
REVOKE EXECUTE ON FUNCTION public.enqueue_email(queue_name text, payload jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(queue_name text, message_id bigint) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_finish_expired_auctions() FROM anon, authenticated, PUBLIC;

-- Admin / authenticated-only RPCs: never callable by anonymous visitors
REVOKE EXECUTE ON FUNCTION public.admin_create_auction_deposit(p_auction_id uuid, p_user_id uuid, p_amount numeric, p_auction_title text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_property(p_property_id uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_link_investor_to_property(p_property_id uuid, p_user_id uuid, p_amount numeric, p_property_title text, p_fee_service numeric, p_fee_renovation numeric, p_fee_sales numeric, p_fee_profit_rate numeric) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_unlink_investor(p_property_id uuid, p_user_id uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refund_auction_deposit(p_deposit_id uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_auction_deposit(p_auction_id uuid, p_user_id uuid, p_amount numeric, p_auction_title text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.property_has_investors(prop_id uuid) FROM anon, PUBLIC;

-- 3. Replace always-true INSERT policy on account_deletion_requests with a validated check
DROP POLICY IF EXISTS "Anyone can insert deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Anyone can insert deletion requests"
ON public.account_deletion_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND char_length(email) BETWEEN 3 AND 320
  AND email LIKE '%_@_%._%'
);

-- 4. Storage: restrict user receipts (in property-media) to owner + admins
DROP POLICY IF EXISTS "Public read user receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;

CREATE POLICY "Owners and admins read receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'property-media'
  AND (storage.foldername(name))[1] = 'user-receipts'
  AND (
    (storage.foldername(name))[2] = auth.uid()::text
    OR has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Users can upload own receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-media'
  AND (storage.foldername(name))[1] = 'user-receipts'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 5. Storage: stop broad public listing of property-media (CDN public file reads still work)
DROP POLICY IF EXISTS "Authenticated can view property media" ON storage.objects;
CREATE POLICY "Authenticated can view property media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'property-media'
  AND (storage.foldername(name))[1] <> 'user-receipts'
);

-- 6. Storage: blog-images viewable via CDN; restrict listing to authenticated
DROP POLICY IF EXISTS "Blog images are publicly accessible" ON storage.objects;
CREATE POLICY "Blog images viewable by authenticated"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'blog-images');

-- 7. Storage: contracts become private; restrict reads to owner + admins
DROP POLICY IF EXISTS "Authenticated can view contracts" ON storage.objects;
CREATE POLICY "Owners and admins view contracts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contracts'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_role(auth.uid(), 'admin')
  )
);