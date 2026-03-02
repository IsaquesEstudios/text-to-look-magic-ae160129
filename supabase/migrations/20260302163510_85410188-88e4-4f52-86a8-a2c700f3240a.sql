
CREATE OR REPLACE FUNCTION public.admin_create_auction_deposit(
  p_auction_id uuid,
  p_user_id uuid,
  p_amount numeric,
  p_auction_title text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_fee numeric;
  v_user_credits numeric;
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem criar depósitos';
  END IF;

  -- Validate minimum amount
  IF p_amount < 800 THEN
    RAISE EXCEPTION 'O valor mínimo para participar é $800';
  END IF;

  -- Check user balance
  SELECT credits INTO v_user_credits FROM profiles WHERE user_id = p_user_id;
  IF v_user_credits IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
  IF v_user_credits < p_amount THEN
    RAISE EXCEPTION 'Créditos insuficientes. Saldo: $%', round(v_user_credits, 2);
  END IF;

  -- Calculate service fee
  IF p_amount >= 11000 THEN
    v_fee := 5000;
  ELSE
    v_fee := 500;
  END IF;

  -- Create deposit
  INSERT INTO auction_deposits (auction_id, user_id, amount, service_fee)
  VALUES (p_auction_id, p_user_id, p_amount, v_fee);

  -- Debit credits
  UPDATE profiles SET credits = credits - p_amount WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
  VALUES (p_user_id, -p_amount, 'deposit', 'Depósito no leilão: ' || p_auction_title || ' (por admin)', auth.uid());
END;
$$;
