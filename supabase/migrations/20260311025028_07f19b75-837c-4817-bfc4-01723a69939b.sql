
-- Contracts table
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  pdf_url text NOT NULL,
  user_signed_at timestamp with time zone DEFAULT NULL,
  admin_signed_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Users can view their own contracts
CREATE POLICY "Users can view own contracts" ON public.contracts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Admins can insert contracts
CREATE POLICY "Admins can insert contracts" ON public.contracts
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can update contracts
CREATE POLICY "Admins can update contracts" ON public.contracts
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- Admins can delete contracts
CREATE POLICY "Admins can delete contracts" ON public.contracts
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Storage bucket for contract PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', true);

-- Storage policies
CREATE POLICY "Admins can upload contracts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contracts' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view contracts" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'contracts');

CREATE POLICY "Admins can delete contract files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'contracts' AND has_role(auth.uid(), 'admin'));
