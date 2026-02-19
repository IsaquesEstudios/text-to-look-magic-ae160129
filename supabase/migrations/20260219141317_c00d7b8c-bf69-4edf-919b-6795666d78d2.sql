-- Allow admins to delete shares (for unlinking investors)
CREATE POLICY "Admins can delete shares"
ON public.shares
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
