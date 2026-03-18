
CREATE TABLE public.account_deletion_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert deletion requests"
  ON public.account_deletion_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view deletion requests"
  ON public.account_deletion_requests
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update deletion requests"
  ON public.account_deletion_requests
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));
