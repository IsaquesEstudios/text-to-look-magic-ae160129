-- Drop the restrictive SELECT policy and recreate as permissive
DROP POLICY IF EXISTS "Authenticated can view auctions" ON public.auctions;
CREATE POLICY "Authenticated can view auctions"
  ON public.auctions
  FOR SELECT
  TO authenticated
  USING (true);
