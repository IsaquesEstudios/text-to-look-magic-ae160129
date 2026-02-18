-- Allow users to insert their own credit_transactions (for deposit type)
CREATE POLICY "Users can insert own deposit transactions"
ON public.credit_transactions
FOR INSERT
WITH CHECK (user_id = auth.uid() AND type = 'deposit');
