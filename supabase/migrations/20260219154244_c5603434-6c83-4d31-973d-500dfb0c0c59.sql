
-- Função atômica para processar depósito em leilão
CREATE OR REPLACE FUNCTION public.process_auction_deposit(
  p_auction_id uuid,
  p_user_id uuid,
  p_amount numeric,
  p_auction_title text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar créditos suficientes
  IF (SELECT credits FROM profiles WHERE user_id = p_user_id) < p_amount THEN
    RAISE EXCEPTION 'Créditos insuficientes';
  END IF;

  -- Inserir depósito
  INSERT INTO auction_deposits (auction_id, user_id, amount)
  VALUES (p_auction_id, p_user_id, p_amount);

  -- Subtrair créditos
  UPDATE profiles SET credits = credits - p_amount WHERE user_id = p_user_id;

  -- Registrar transação
  INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
  VALUES (p_user_id, -p_amount, 'deposit', 'Depósito no leilão: ' || p_auction_title, p_user_id);
END;
$$;

-- Função atômica para estornar depósito (admin)
CREATE OR REPLACE FUNCTION public.refund_auction_deposit(
  p_deposit_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_amount numeric;
  v_auction_title text;
BEGIN
  -- Verificar se quem chama é admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem estornar depósitos';
  END IF;

  -- Buscar dados do depósito
  SELECT ad.user_id, ad.amount, a.title
  INTO v_user_id, v_amount, v_auction_title
  FROM auction_deposits ad
  JOIN auctions a ON a.id = ad.auction_id
  WHERE ad.id = p_deposit_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Depósito não encontrado';
  END IF;

  -- Deletar depósito
  DELETE FROM auction_deposits WHERE id = p_deposit_id;

  -- Devolver créditos
  UPDATE profiles SET credits = credits + v_amount WHERE user_id = v_user_id;

  -- Registrar estorno
  INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
  VALUES (v_user_id, v_amount, 'refund', 'Estorno de depósito - Leilão: ' || v_auction_title, auth.uid());
END;
$$;
