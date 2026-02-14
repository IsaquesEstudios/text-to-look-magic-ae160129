
-- Step 1: Drop the old check constraint
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_status_check;

-- Step 2: Update existing data to new statuses
UPDATE public.properties SET status = 'auctioned' WHERE status = 'purchased';
UPDATE public.properties SET status = 'renovation_in_progress' WHERE status = 'renovating';
UPDATE public.properties SET status = 'for_sale' WHERE status = 'selling';

-- Step 3: Add new check constraint with all new status values
ALTER TABLE public.properties ADD CONSTRAINT properties_status_check
CHECK (status = ANY (ARRAY[
  'available'::text,
  'auctioned'::text,
  'waiting_permit'::text,
  'renovation_in_progress'::text,
  'for_sale'::text,
  'under_contract'::text,
  'sold'::text
]));
