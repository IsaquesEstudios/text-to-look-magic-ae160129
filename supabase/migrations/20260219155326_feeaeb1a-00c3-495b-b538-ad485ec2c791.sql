
-- =============================================
-- FASE 1: Recriar TODAS as políticas RLS como PERMISSIVE
-- =============================================

-- ---- profiles ----
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Auto-create profile on signup" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Auto-create profile on signup" ON profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ---- user_roles ----
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;

CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ---- shares ----
DROP POLICY IF EXISTS "Users can view own shares" ON shares;
DROP POLICY IF EXISTS "Admins can view all shares" ON shares;
DROP POLICY IF EXISTS "Admins can insert shares" ON shares;
DROP POLICY IF EXISTS "Admins can delete shares" ON shares;

CREATE POLICY "Users can view own shares" ON shares FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all shares" ON shares FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert shares" ON shares FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete shares" ON shares FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ---- credit_transactions ----
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Admins can insert transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can insert own deposit transactions" ON credit_transactions;

CREATE POLICY "Users can view own transactions" ON credit_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all transactions" ON credit_transactions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert transactions" ON credit_transactions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own deposit transactions" ON credit_transactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND type = 'deposit');

-- ---- auction_deposits ----
DROP POLICY IF EXISTS "Users can view own deposits" ON auction_deposits;
DROP POLICY IF EXISTS "Admins can view all deposits" ON auction_deposits;
DROP POLICY IF EXISTS "Users can insert own deposits" ON auction_deposits;

CREATE POLICY "Users can view own deposits" ON auction_deposits FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all deposits" ON auction_deposits FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own deposits" ON auction_deposits FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ---- auctions ----
DROP POLICY IF EXISTS "Authenticated can view auctions" ON auctions;
DROP POLICY IF EXISTS "Admins can insert auctions" ON auctions;
DROP POLICY IF EXISTS "Admins can update auctions" ON auctions;
DROP POLICY IF EXISTS "Admins can delete auctions" ON auctions;

CREATE POLICY "Authenticated can view auctions" ON auctions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert auctions" ON auctions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update auctions" ON auctions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete auctions" ON auctions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ---- auction_items ----
DROP POLICY IF EXISTS "Authenticated can view auction items" ON auction_items;
DROP POLICY IF EXISTS "Admins can insert auction items" ON auction_items;
DROP POLICY IF EXISTS "Admins can update auction items" ON auction_items;
DROP POLICY IF EXISTS "Admins can delete auction items" ON auction_items;

CREATE POLICY "Authenticated can view auction items" ON auction_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert auction items" ON auction_items FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update auction items" ON auction_items FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete auction items" ON auction_items FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ---- auction_reads ----
DROP POLICY IF EXISTS "Users can view own auction reads" ON auction_reads;
DROP POLICY IF EXISTS "Users can insert own auction reads" ON auction_reads;
DROP POLICY IF EXISTS "Users can update own auction reads" ON auction_reads;

CREATE POLICY "Users can view own auction reads" ON auction_reads FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own auction reads" ON auction_reads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own auction reads" ON auction_reads FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ---- properties ----
DROP POLICY IF EXISTS "Authenticated users can view properties" ON properties;
DROP POLICY IF EXISTS "Admins can insert properties" ON properties;
DROP POLICY IF EXISTS "Admins can update properties" ON properties;
DROP POLICY IF EXISTS "Admins can delete properties" ON properties;

CREATE POLICY "Authenticated users can view properties" ON properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert properties" ON properties FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update properties" ON properties FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete properties" ON properties FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ---- property_expenses ----
DROP POLICY IF EXISTS "Shareholders can view expenses" ON property_expenses;
DROP POLICY IF EXISTS "Admins can manage expenses" ON property_expenses;
DROP POLICY IF EXISTS "Admins can update expenses" ON property_expenses;
DROP POLICY IF EXISTS "Admins can delete expenses" ON property_expenses;

CREATE POLICY "Shareholders can view expenses" ON property_expenses FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM shares WHERE shares.property_id = property_expenses.property_id AND shares.user_id = auth.uid()));
CREATE POLICY "Admins can manage expenses" ON property_expenses FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update expenses" ON property_expenses FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete expenses" ON property_expenses FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ---- property_messages ----
DROP POLICY IF EXISTS "Shareholders can view messages" ON property_messages;
DROP POLICY IF EXISTS "Admins can insert messages" ON property_messages;

CREATE POLICY "Shareholders can view messages" ON property_messages FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM shares WHERE shares.property_id = property_messages.property_id AND shares.user_id = auth.uid()));
CREATE POLICY "Admins can insert messages" ON property_messages FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

-- ---- property_message_reads ----
DROP POLICY IF EXISTS "Users can view own reads" ON property_message_reads;
DROP POLICY IF EXISTS "Users can upsert own reads" ON property_message_reads;
DROP POLICY IF EXISTS "Users can update own reads" ON property_message_reads;

CREATE POLICY "Users can view own reads" ON property_message_reads FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can upsert own reads" ON property_message_reads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own reads" ON property_message_reads FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ---- property_expense_reads ----
DROP POLICY IF EXISTS "Users can view own expense reads" ON property_expense_reads;
DROP POLICY IF EXISTS "Users can upsert own expense reads" ON property_expense_reads;
DROP POLICY IF EXISTS "Users can update own expense reads" ON property_expense_reads;

CREATE POLICY "Users can view own expense reads" ON property_expense_reads FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can upsert own expense reads" ON property_expense_reads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own expense reads" ON property_expense_reads FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ---- property_images ----
DROP POLICY IF EXISTS "Authenticated can view property images" ON property_images;
DROP POLICY IF EXISTS "Admins can manage property images" ON property_images;
DROP POLICY IF EXISTS "Admins can delete property images" ON property_images;

CREATE POLICY "Authenticated can view property images" ON property_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage property images" ON property_images FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete property images" ON property_images FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ---- user_payment_images ----
DROP POLICY IF EXISTS "Users can view own payment images" ON user_payment_images;
DROP POLICY IF EXISTS "Admins can view all payment images" ON user_payment_images;
DROP POLICY IF EXISTS "Admins can insert payment images" ON user_payment_images;
DROP POLICY IF EXISTS "Admins can delete payment images" ON user_payment_images;

CREATE POLICY "Users can view own payment images" ON user_payment_images FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all payment images" ON user_payment_images FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert payment images" ON user_payment_images FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete payment images" ON user_payment_images FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ---- blog_posts ----
DROP POLICY IF EXISTS "Blog posts are publicly readable" ON blog_posts;

CREATE POLICY "Blog posts are publicly readable" ON blog_posts FOR SELECT USING (published_at IS NOT NULL AND published_at <= now());

-- ---- us_state_taxes ----
DROP POLICY IF EXISTS "Anyone authenticated can view taxes" ON us_state_taxes;
DROP POLICY IF EXISTS "Admins can manage taxes" ON us_state_taxes;

CREATE POLICY "Anyone authenticated can view taxes" ON us_state_taxes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage taxes" ON us_state_taxes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- =============================================
-- FASE 3: Remover função purchase_share (código morto)
-- =============================================
DROP FUNCTION IF EXISTS public.purchase_share(uuid, uuid);
