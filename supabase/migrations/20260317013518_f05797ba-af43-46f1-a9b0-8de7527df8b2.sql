CREATE OR REPLACE FUNCTION public.admin_link_investor_to_property(p_property_id uuid, p_user_id uuid, p_amount numeric, p_property_type text, p_property_title text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_service_fee numeric;
  v_total_project numeric;
  v_fee_share numeric;
  v_total_deduction numeric;
  v_user_credits numeric;
  v_already_invested numeric;
  v_remaining numeric;
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem vincular investidores';
  END IF;

  -- Determine service fee based on property type
  IF p_property_type = 'land' OR p_property_type = 'terreno' THEN
    v_service_fee := 500;
  ELSE
    v_service_fee := 5000;
  END IF;

  -- Get total project cost
  SELECT COALESCE(estimated_auction_value, 0) + COALESCE(estimated_renovation_cost, 0)
  INTO v_total_project
  FROM properties
  WHERE id = p_property_id;

  IF v_total_project IS NULL OR v_total_project <= 0 THEN
    RAISE EXCEPTION 'Custo total do projeto inválido';
  END IF;

  -- Check how much is already invested
  SELECT COALESCE(SUM(amount_paid), 0) INTO v_already_invested
  FROM shares WHERE property_id = p_property_id;

  v_remaining := v_total_project - v_already_invested;

  IF p_amount > v_remaining THEN
    RAISE EXCEPTION 'Valor excede o restante do projeto. Disponível: $%', ROUND(v_remaining, 2);
  END IF;

  -- Calculate proportional fee: (amount / total_project) * service_fee
  v_fee_share := ROUND((p_amount / v_total_project) * v_service_fee, 2);
  v_total_deduction := p_amount + v_fee_share;

  -- Check user credits
  SELECT credits INTO v_user_credits FROM profiles WHERE user_id = p_user_id;
  IF v_user_credits IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
  IF v_user_credits < v_total_deduction THEN
    RAISE EXCEPTION 'Créditos insuficientes. Necessário: $% (investimento: $% + taxa: $%). Saldo: $%',
      ROUND(v_total_deduction, 2), ROUND(p_amount, 2), ROUND(v_fee_share, 2), ROUND(v_user_credits, 2);
  END IF;

  -- Create share record
  INSERT INTO shares (property_id, user_id, quantity, amount_paid)
  VALUES (p_property_id, p_user_id, 1, p_amount);

  -- Deduct total (investment + fee) from credits
  UPDATE profiles SET credits = credits - v_total_deduction WHERE user_id = p_user_id;

  -- Log investment transaction
  INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
  VALUES (p_user_id, -p_amount, 'deposit', 'Investimento vinculado - ' || p_property_title, auth.uid());

  -- Log service fee transaction
  INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
  VALUES (p_user_id, -v_fee_share, 'deposit', 'Taxa de serviço - ' || p_property_title, auth.uid());
END;
$function$;