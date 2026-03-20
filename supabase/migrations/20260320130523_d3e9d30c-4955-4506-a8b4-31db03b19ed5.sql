
-- Allow users to insert their own contracts
CREATE POLICY "Users can insert own contracts"
ON public.contracts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own contracts
CREATE POLICY "Users can delete own contracts"
ON public.contracts
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Allow authenticated users to upload to contracts storage bucket
CREATE POLICY "Users can upload own contracts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contracts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own contract files from storage
CREATE POLICY "Users can delete own contract files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'contracts' AND (storage.foldername(name))[1] = auth.uid()::text);
