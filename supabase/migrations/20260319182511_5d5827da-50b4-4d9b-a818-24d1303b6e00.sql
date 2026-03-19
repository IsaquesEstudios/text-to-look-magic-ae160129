ALTER TABLE public.auction_items
  ADD COLUMN IF NOT EXISTS state_code text,
  ADD COLUMN IF NOT EXISTS estimated_auction_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_renovation_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_sale_value numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_timeline text DEFAULT '',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}';
