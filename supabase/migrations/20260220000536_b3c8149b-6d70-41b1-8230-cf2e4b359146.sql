CREATE OR REPLACE FUNCTION public.process_auction_deposit(p_auction_id uuid, p_user_id uuid, p_amount numeric, p_auction_title text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validar valor mínimo
  IF p_amount < 800 THEN
    RAISE EXCEPTION 'O valor mínimo para participar é $800';
  END IF;

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
$function$;