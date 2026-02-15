
-- Table for US state tax rates
CREATE TABLE public.us_state_taxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state_code TEXT NOT NULL UNIQUE,
  state_name TEXT NOT NULL,
  tax_rate NUMERIC NOT NULL DEFAULT 0
);

ALTER TABLE public.us_state_taxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view taxes" ON public.us_state_taxes FOR SELECT USING (true);
CREATE POLICY "Admins can manage taxes" ON public.us_state_taxes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add tax columns to property_expenses
ALTER TABLE public.property_expenses
  ADD COLUMN state_code TEXT,
  ADD COLUMN tax_rate NUMERIC DEFAULT 0;

-- Seed US state sales tax rates (approximate 2025 values)
INSERT INTO public.us_state_taxes (state_code, state_name, tax_rate) VALUES
  ('AL', 'Alabama', 4.00),
  ('AK', 'Alaska', 0.00),
  ('AZ', 'Arizona', 5.60),
  ('AR', 'Arkansas', 6.50),
  ('CA', 'California', 7.25),
  ('CO', 'Colorado', 2.90),
  ('CT', 'Connecticut', 6.35),
  ('DE', 'Delaware', 0.00),
  ('FL', 'Florida', 6.00),
  ('GA', 'Georgia', 4.00),
  ('HI', 'Hawaii', 4.00),
  ('ID', 'Idaho', 6.00),
  ('IL', 'Illinois', 6.25),
  ('IN', 'Indiana', 7.00),
  ('IA', 'Iowa', 6.00),
  ('KS', 'Kansas', 6.50),
  ('KY', 'Kentucky', 6.00),
  ('LA', 'Louisiana', 4.45),
  ('ME', 'Maine', 5.50),
  ('MD', 'Maryland', 6.00),
  ('MA', 'Massachusetts', 6.25),
  ('MI', 'Michigan', 6.00),
  ('MN', 'Minnesota', 6.875),
  ('MS', 'Mississippi', 7.00),
  ('MO', 'Missouri', 4.225),
  ('MT', 'Montana', 0.00),
  ('NE', 'Nebraska', 5.50),
  ('NV', 'Nevada', 6.85),
  ('NH', 'New Hampshire', 0.00),
  ('NJ', 'New Jersey', 6.625),
  ('NM', 'New Mexico', 4.875),
  ('NY', 'New York', 4.00),
  ('NC', 'North Carolina', 4.75),
  ('ND', 'North Dakota', 5.00),
  ('OH', 'Ohio', 5.75),
  ('OK', 'Oklahoma', 4.50),
  ('OR', 'Oregon', 0.00),
  ('PA', 'Pennsylvania', 6.00),
  ('RI', 'Rhode Island', 7.00),
  ('SC', 'South Carolina', 6.00),
  ('SD', 'South Dakota', 4.20),
  ('TN', 'Tennessee', 7.00),
  ('TX', 'Texas', 6.25),
  ('UT', 'Utah', 6.10),
  ('VT', 'Vermont', 6.00),
  ('VA', 'Virginia', 5.30),
  ('WA', 'Washington', 6.50),
  ('WV', 'West Virginia', 6.00),
  ('WI', 'Wisconsin', 5.00),
  ('WY', 'Wyoming', 4.00),
  ('DC', 'District of Columbia', 6.00);
