
-- 1. Role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can see their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  credits numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Auto-create profile on signup"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  -- Auto-assign admin role for specific email
  IF NEW.email = 'admin@discoveryinvestimentos.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  
  -- Always assign user role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_blog_posts_updated_at();

-- 3. Properties table (imóveis/terrenos)
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  type text NOT NULL CHECK (type IN ('house', 'land')),
  title text NOT NULL,
  location text NOT NULL,
  purchase_price numeric(12,2) NOT NULL,
  estimated_return_pct numeric(5,2) NOT NULL DEFAULT 0,
  total_shares integer NOT NULL DEFAULT 1,
  share_price numeric(12,2) NOT NULL,
  available_shares integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'purchased', 'renovating', 'selling', 'sold')),
  cover_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can see properties
CREATE POLICY "Authenticated users can view properties"
  ON public.properties FOR SELECT TO authenticated
  USING (true);

-- Only admins can create/update/delete
CREATE POLICY "Admins can insert properties"
  ON public.properties FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update properties"
  ON public.properties FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete properties"
  ON public.properties FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_blog_posts_updated_at();

-- 4. Property images (gallery)
CREATE TABLE public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view property images"
  ON public.property_images FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage property images"
  ON public.property_images FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete property images"
  ON public.property_images FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Shares (cotas) - user investments
CREATE TABLE public.shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  amount_paid numeric(12,2) NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shares"
  ON public.shares FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all shares"
  ON public.shares FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert shares"
  ON public.shares FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Property messages (comunidade)
CREATE TABLE public.property_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  content text,
  media_url text,
  media_type text CHECK (media_type IN ('image', 'video', NULL)),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_messages ENABLE ROW LEVEL SECURITY;

-- Only admins can post messages
CREATE POLICY "Admins can insert messages"
  ON public.property_messages FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Shareholders and admins can view messages
CREATE POLICY "Shareholders can view messages"
  ON public.property_messages FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.shares
      WHERE shares.property_id = property_messages.property_id
      AND shares.user_id = auth.uid()
    )
  );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_messages;

-- 7. Expense categories and items
CREATE TABLE public.property_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  product text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage expenses"
  ON public.property_expenses FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update expenses"
  ON public.property_expenses FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete expenses"
  ON public.property_expenses FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Shareholders can view expenses"
  ON public.property_expenses FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.shares
      WHERE shares.property_id = property_expenses.property_id
      AND shares.user_id = auth.uid()
    )
  );

-- 8. Credit transactions (histórico de créditos)
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric(12,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'investment')),
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.credit_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions"
  ON public.credit_transactions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert transactions"
  ON public.credit_transactions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. Storage bucket for property images
INSERT INTO storage.buckets (id, name, public) VALUES ('property-media', 'property-media', true);

CREATE POLICY "Authenticated can view property media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-media');

CREATE POLICY "Admins can upload property media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete property media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-media' AND public.has_role(auth.uid(), 'admin'));
