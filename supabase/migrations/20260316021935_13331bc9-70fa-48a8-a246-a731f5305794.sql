-- Allow users to insert their own payment images (type = 'sent')
CREATE POLICY "Users can insert own sent receipts"
ON public.user_payment_images
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND uploaded_by = auth.uid() 
  AND type = 'sent'
);

-- Allow users to delete their own sent receipts
CREATE POLICY "Users can delete own sent receipts"
ON public.user_payment_images
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND uploaded_by = auth.uid()
  AND type = 'sent'
);

-- Storage: allow authenticated users to upload to user-receipts folder in property-media bucket
CREATE POLICY "Users can upload receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-media'
  AND (storage.foldername(name))[1] = 'user-receipts'
);

-- Allow public read of user-receipts
CREATE POLICY "Public read user receipts"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'property-media'
  AND (storage.foldername(name))[1] = 'user-receipts'
);