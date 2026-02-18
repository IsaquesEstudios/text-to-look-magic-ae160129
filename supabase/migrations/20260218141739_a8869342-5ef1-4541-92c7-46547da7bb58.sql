
ALTER TABLE public.auction_items ADD COLUMN property_id uuid REFERENCES public.properties(id);
CREATE INDEX idx_auction_items_property_id ON public.auction_items(property_id);
