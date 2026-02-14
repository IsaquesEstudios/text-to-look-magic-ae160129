
-- 1. Create user_payment_images table
CREATE TABLE public.user_payment_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('received', 'sent')),
  image_url text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_payment_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment images"
ON public.user_payment_images FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all payment images"
ON public.user_payment_images FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert payment images"
ON public.user_payment_images FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete payment images"
ON public.user_payment_images FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 2. Add new columns to properties
ALTER TABLE public.properties
ADD COLUMN estimated_auction_value numeric DEFAULT 0,
ADD COLUMN estimated_renovation_cost numeric DEFAULT 0,
ADD COLUMN estimated_timeline text DEFAULT '';
