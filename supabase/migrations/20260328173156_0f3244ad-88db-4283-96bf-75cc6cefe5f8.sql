
-- 1. Add investment_plan column to shares
ALTER TABLE public.shares ADD COLUMN investment_plan text NOT NULL DEFAULT 'standard';

-- 2. Update admin_link_investor_to_property to accept investment plan
CREATE OR REPLACE FUNCTION public.admin_link_investor_to_property(
  p_property_id uuid, p_user_id uuid, p_amount numeric, 
  p_property_type text, p_property_title text, p_investment_plan text DEFAULT 'standard'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_service_fee numeric;
  v_renovation_fee numeric;
  v_total_project numeric;
  v_renovation_cost numeric;
  v_fee_share numeric;
  v_reno_fee_share numeric;
  v_total_deduction numeric;
  v_user_credits numeric;
  v_already_invested numeric;
  v_remaining numeric;
  v_plan text;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem vincular investidores';
  END IF;

  -- Validate plan
  v_plan := COALESCE(p_investment_plan, 'standard');
  IF v_plan NOT IN ('standard', 'equal_split', 'fixed_12', 'fixed_15') THEN
    RAISE EXCEPTION 'Plano de investimento inválido: %', v_plan;
  END IF;

  -- Get total project cost and renovation cost
  SELECT COALESCE(estimated_auction_value, 0) + COALESCE(estimated_renovation_cost, 0),
         COALESCE(estimated_renovation_cost, 0)
  INTO v_total_project, v_renovation_cost
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

  -- Calculate fees based on plan
  IF v_plan = 'standard' THEN
    -- Arremate fee
    IF p_property_type = 'land' OR p_property_type = 'terreno' THEN
      v_service_fee := 500;
    ELSE
      v_service_fee := 5000;
    END IF;
    v_fee_share := ROUND((p_amount / v_total_project) * v_service_fee, 2);
    
    -- Renovation fee (10% of estimated renovation cost, proportional)
    v_reno_fee_share := ROUND((p_amount / v_total_project) * (v_renovation_cost * 0.10), 2);
    
    v_total_deduction := p_amount + v_fee_share + v_reno_fee_share;
  ELSE
    -- No fees for equal_split, fixed_12, fixed_15
    v_fee_share := 0;
    v_reno_fee_share := 0;
    v_total_deduction := p_amount;
  END IF;

  -- Check user credits
  SELECT credits INTO v_user_credits FROM profiles WHERE user_id = p_user_id;
  IF v_user_credits IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
  IF v_user_credits < v_total_deduction THEN
    RAISE EXCEPTION 'Créditos insuficientes. Necessário: $% (investimento: $% + taxas: $%). Saldo: $%',
      ROUND(v_total_deduction, 2), ROUND(p_amount, 2), ROUND(v_fee_share + v_reno_fee_share, 2), ROUND(v_user_credits, 2);
  END IF;

  -- Create share record with plan
  INSERT INTO shares (property_id, user_id, quantity, amount_paid, investment_plan)
  VALUES (p_property_id, p_user_id, 1, p_amount, v_plan);

  -- Deduct total from credits
  UPDATE profiles SET credits = credits - v_total_deduction WHERE user_id = p_user_id;

  -- Log investment transaction
  INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
  VALUES (p_user_id, -p_amount, 'deposit', 'Investimento vinculado - ' || p_property_title, auth.uid());

  -- Log service fee transaction (arremate)
  IF v_fee_share > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
    VALUES (p_user_id, -v_fee_share, 'deposit', 'Taxa de arremate - ' || p_property_title, auth.uid());
  END IF;

  -- Log renovation fee transaction
  IF v_reno_fee_share > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
    VALUES (p_user_id, -v_reno_fee_share, 'deposit', 'Taxa de reforma (10%) - ' || p_property_title, auth.uid());
  END IF;
END;
$function$;

-- 3. Update admin_unlink_investor to handle plan-based refunds
CREATE OR REPLACE FUNCTION public.admin_unlink_investor(p_property_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_share RECORD;
  v_total_invested numeric := 0;
  v_total_arremate_fee numeric := 0;
  v_total_reno_fee numeric := 0;
  v_total_refund numeric;
  v_service_fee numeric;
  v_total_project numeric;
  v_renovation_cost numeric;
  v_property_type text;
  v_property_title text;
  v_remaining_shares integer;
  v_is_auction_property boolean;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem desvincular investidores';
  END IF;

  SELECT type, title, 
         COALESCE(estimated_auction_value, 0) + COALESCE(estimated_renovation_cost, 0),
         COALESCE(estimated_renovation_cost, 0)
  INTO v_property_type, v_property_title, v_total_project, v_renovation_cost
  FROM properties WHERE id = p_property_id;

  IF v_property_title IS NULL THEN
    RAISE EXCEPTION 'Propriedade não encontrada';
  END IF;

  IF v_property_type = 'land' OR v_property_type = 'terreno' THEN
    v_service_fee := 500;
  ELSE
    v_service_fee := 5000;
  END IF;

  -- Calculate refund for each share based on its plan
  FOR v_share IN
    SELECT amount_paid, investment_plan FROM shares
    WHERE property_id = p_property_id AND user_id = p_user_id
  LOOP
    v_total_invested := v_total_invested + v_share.amount_paid;
    
    IF v_share.investment_plan = 'standard' AND v_total_project > 0 THEN
      v_total_arremate_fee := v_total_arremate_fee + ROUND((v_share.amount_paid / v_total_project) * v_service_fee, 2);
      v_total_reno_fee := v_total_reno_fee + ROUND((v_share.amount_paid / v_total_project) * (v_renovation_cost * 0.10), 2);
    END IF;
  END LOOP;

  IF v_total_invested <= 0 THEN
    RAISE EXCEPTION 'Investidor não possui vínculo com esta propriedade';
  END IF;

  v_total_refund := v_total_invested + v_total_arremate_fee + v_total_reno_fee;

  -- Delete shares
  DELETE FROM shares WHERE property_id = p_property_id AND user_id = p_user_id;

  -- Refund credits
  UPDATE profiles SET credits = credits + v_total_refund WHERE user_id = p_user_id;

  -- Log refund transactions
  INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
  VALUES (p_user_id, v_total_invested, 'refund', 'Estorno investimento - ' || v_property_title, auth.uid());

  IF v_total_arremate_fee > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
    VALUES (p_user_id, v_total_arremate_fee, 'refund', 'Estorno taxa de arremate - ' || v_property_title, auth.uid());
  END IF;

  IF v_total_reno_fee > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
    VALUES (p_user_id, v_total_reno_fee, 'refund', 'Estorno taxa de reforma - ' || v_property_title, auth.uid());
  END IF;

  -- Check remaining investors
  SELECT COUNT(*) INTO v_remaining_shares FROM shares WHERE property_id = p_property_id;

  IF v_remaining_shares = 0 THEN
    SELECT EXISTS(SELECT 1 FROM auction_items WHERE property_id = p_property_id) INTO v_is_auction_property;

    IF v_is_auction_property THEN
      DELETE FROM property_images WHERE property_id = p_property_id;
      DELETE FROM property_messages WHERE property_id = p_property_id;
      DELETE FROM property_expenses WHERE property_id = p_property_id;
      DELETE FROM property_message_reads WHERE property_id = p_property_id;
      DELETE FROM property_expense_reads WHERE property_id = p_property_id;
      UPDATE auction_items SET property_id = NULL WHERE property_id = p_property_id;
      DELETE FROM properties WHERE id = p_property_id;
    END IF;
  END IF;
END;
$function$;

-- 4. Update admin_delete_property to handle plan-based refunds
CREATE OR REPLACE FUNCTION public.admin_delete_property(p_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_share RECORD;
  v_service_fee numeric;
  v_total_project numeric;
  v_renovation_cost numeric;
  v_property_type text;
  v_fee_share numeric;
  v_reno_fee_share numeric;
  v_total_refund numeric;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir propriedades';
  END IF;

  SELECT type, COALESCE(estimated_auction_value, 0) + COALESCE(estimated_renovation_cost, 0),
         COALESCE(estimated_renovation_cost, 0)
  INTO v_property_type, v_total_project, v_renovation_cost
  FROM properties WHERE id = p_property_id;

  IF v_property_type = 'land' OR v_property_type = 'terreno' THEN
    v_service_fee := 500;
  ELSE
    v_service_fee := 5000;
  END IF;

  -- Refund each investor based on their plan
  FOR v_share IN
    SELECT s.user_id, s.amount_paid, s.investment_plan, p.title as property_title
    FROM shares s
    JOIN properties p ON p.id = s.property_id
    WHERE s.property_id = p_property_id
  LOOP
    v_fee_share := 0;
    v_reno_fee_share := 0;

    IF v_share.investment_plan = 'standard' AND v_total_project > 0 THEN
      v_fee_share := ROUND((v_share.amount_paid / v_total_project) * v_service_fee, 2);
      v_reno_fee_share := ROUND((v_share.amount_paid / v_total_project) * (v_renovation_cost * 0.10), 2);
    END IF;

    v_total_refund := v_share.amount_paid + v_fee_share + v_reno_fee_share;

    UPDATE profiles SET credits = credits + v_total_refund WHERE user_id = v_share.user_id;

    INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
    VALUES (v_share.user_id, v_share.amount_paid, 'refund', 'Estorno investimento - Exclusão: ' || v_share.property_title, auth.uid());

    IF v_fee_share > 0 THEN
      INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
      VALUES (v_share.user_id, v_fee_share, 'refund', 'Estorno taxa arremate - Exclusão: ' || v_share.property_title, auth.uid());
    END IF;

    IF v_reno_fee_share > 0 THEN
      INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
      VALUES (v_share.user_id, v_reno_fee_share, 'refund', 'Estorno taxa reforma - Exclusão: ' || v_share.property_title, auth.uid());
    END IF;
  END LOOP;

  DELETE FROM shares WHERE property_id = p_property_id;
  DELETE FROM property_images WHERE property_id = p_property_id;
  DELETE FROM property_messages WHERE property_id = p_property_id;
  DELETE FROM property_expenses WHERE property_id = p_property_id;
  DELETE FROM property_message_reads WHERE property_id = p_property_id;
  DELETE FROM property_expense_reads WHERE property_id = p_property_id;
  UPDATE auction_items SET property_id = NULL WHERE property_id = p_property_id;
  DELETE FROM properties WHERE id = p_property_id;
END;
$function$;
