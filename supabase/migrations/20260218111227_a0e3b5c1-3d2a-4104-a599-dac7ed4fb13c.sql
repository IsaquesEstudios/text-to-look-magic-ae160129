
-- Track when users last viewed the auctions list
CREATE TABLE public.auction_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.auction_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own auction reads" ON public.auction_reads FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own auction reads" ON public.auction_reads FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own auction reads" ON public.auction_reads FOR UPDATE USING (user_id = auth.uid());
