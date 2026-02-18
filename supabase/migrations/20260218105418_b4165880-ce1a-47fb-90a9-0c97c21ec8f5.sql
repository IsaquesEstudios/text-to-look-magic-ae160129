
-- Auctions table
CREATE TABLE public.auctions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'finished')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Auction items (properties/land registered within the auction)
CREATE TABLE public.auction_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'casa',
  location TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Auction deposits (users investing credits)
CREATE TABLE public.auction_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_deposits ENABLE ROW LEVEL SECURITY;

-- Auctions: everyone authenticated can view, admins can manage
CREATE POLICY "Authenticated can view auctions" ON public.auctions FOR SELECT USING (true);
CREATE POLICY "Admins can insert auctions" ON public.auctions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update auctions" ON public.auctions FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete auctions" ON public.auctions FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Auction items: everyone can view, admins manage
CREATE POLICY "Authenticated can view auction items" ON public.auction_items FOR SELECT USING (true);
CREATE POLICY "Admins can insert auction items" ON public.auction_items FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update auction items" ON public.auction_items FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete auction items" ON public.auction_items FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Auction deposits: users can view own + insert own, admins can view all
CREATE POLICY "Users can view own deposits" ON public.auction_deposits FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all deposits" ON public.auction_deposits FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own deposits" ON public.auction_deposits FOR INSERT WITH CHECK (user_id = auth.uid());
