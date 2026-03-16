-- Fix security: remove user self-insert on credit_transactions (only admin should insert via RPC)
DROP POLICY IF EXISTS "Users can insert own deposit transactions" ON public.credit_transactions;

-- Fix security: remove user self-insert on auction_deposits (deposits go through RPC function)
DROP POLICY IF EXISTS "Users can insert own deposits" ON public.auction_deposits;