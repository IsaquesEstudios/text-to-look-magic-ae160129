
-- Create expense reads tracking table
CREATE TABLE public.property_expense_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE public.property_expense_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expense reads" ON public.property_expense_reads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can upsert own expense reads" ON public.property_expense_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own expense reads" ON public.property_expense_reads
  FOR UPDATE USING (user_id = auth.uid());

-- Enable realtime for expenses too
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_expenses;
