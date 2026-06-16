
ALTER TABLE public.shares
  ADD COLUMN IF NOT EXISTS fee_service numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_renovation numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_sales numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_profit_rate numeric NOT NULL DEFAULT 0;

-- Remove old overloads of the linking function
DROP FUNCTION IF EXISTS public.admin_link_investor_to_property(uuid, uuid, numeric, text, text, text);
DROP FUNCTION IF EXISTS public.admin_link_investor_to_property(uuid, uuid, numeric, text, text);

-- New manual-fee linking function
CREATE OR REPLACE FUNCTION public.admin_link_investor_to_property(
  p_property_id uuid,
  p_user_id uuid,
  p_amount numeric,
  p_property_title text,
  p_fee_service numeric DEFAULT 0,
  p_fee_renovation numeric DEFAULT 0,
  p_fee_sales numeric DEFAULT 0,
  p_fee_profit_rate numeric DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total_project numeric;
  v_already_invested numeric;
  v_remaining numeric;
  v_user_credits numeric;
  v_fee_service numeric := GREATEST(COALESCE(p_fee_service, 0), 0);
  v_fee_renovation numeric := GREATEST(COALESCE(p_fee_renovation, 0), 0);
  v_fee_sales numeric := GREATEST(COALESCE(p_fee_sales, 0), 0);
  v_fee_profit_rate numeric := GREATEST(COALESCE(p_fee_profit_rate, 0), 0);
  v_total_fees numeric;
  v_total_deduction numeric;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem vincular investidores';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Valor do aporte inválido';
  END IF;

  SELECT COALESCE(estimated_auction_value, 0) + COALESCE(estimated_renovation_cost, 0)
  INTO v_total_project
  FROM properties
  WHERE id = p_property_id;

  IF v_total_project IS NULL OR v_total_project <= 0 THEN
    RAISE EXCEPTION 'Custo total do projeto inválido';
  END IF;

  SELECT COALESCE(SUM(amount_paid), 0) INTO v_already_invested
  FROM shares WHERE property_id = p_property_id;

  v_remaining := v_total_project - v_already_invested;

  IF p_amount > v_remaining THEN
    RAISE EXCEPTION 'Valor excede o restante do projeto. Disponível: $%', ROUND(v_remaining, 2);
  END IF;

  v_total_fees := ROUND(v_fee_service + v_fee_renovation + v_fee_sales, 2);
  v_total_deduction := ROUND(p_amount + v_total_fees, 2);

  SELECT credits INTO v_user_credits FROM profiles WHERE user_id = p_user_id;
  IF v_user_credits IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
  IF v_user_credits < v_total_deduction THEN
    RAISE EXCEPTION 'Créditos insuficientes. Necessário: $% (investimento: $% + taxas: $%). Saldo: $%',
      ROUND(v_total_deduction, 2), ROUND(p_amount, 2), v_total_fees, ROUND(v_user_credits, 2);
  END IF;

  INSERT INTO shares (property_id, user_id, quantity, amount_paid, fee_service, fee_renovation, fee_sales, fee_profit_rate)
  VALUES (p_property_id, p_user_id, 1, p_amount, v_fee_service, v_fee_renovation, v_fee_sales, v_fee_profit_rate);

  UPDATE profiles SET credits = credits - v_total_deduction WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
  VALUES (p_user_id, -p_amount, 'deposit', 'Investimento vinculado - ' || p_property_title, auth.uid());

  IF v_fee_service > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
    VALUES (p_user_id, -v_fee_service, 'deposit', 'Taxa de serviço - ' || p_property_title, auth.uid());
  END IF;

  IF v_fee_renovation > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
    VALUES (p_user_id, -v_fee_renovation, 'deposit', 'Taxa de reforma - ' || p_property_title, auth.uid());
  END IF;

  IF v_fee_sales > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
    VALUES (p_user_id, -v_fee_sales, 'deposit', 'Taxa de vendas - ' || p_property_title, auth.uid());
  END IF;
END;
$function$;

-- Update unlink to refund based on stored fees
CREATE OR REPLACE FUNCTION public.admin_unlink_investor(p_property_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_share RECORD;
  v_total_invested numeric := 0;
  v_total_service numeric := 0;
  v_total_reno numeric := 0;
  v_total_sales numeric := 0;
  v_legacy_service numeric := 0;
  v_legacy_reno numeric := 0;
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

  FOR v_share IN
    SELECT amount_paid, investment_plan, fee_service, fee_renovation, fee_sales FROM shares
    WHERE property_id = p_property_id AND user_id = p_user_id
  LOOP
    v_total_invested := v_total_invested + v_share.amount_paid;
    v_total_service := v_total_service + COALESCE(v_share.fee_service, 0);
    v_total_reno := v_total_reno + COALESCE(v_share.fee_renovation, 0);
    v_total_sales := v_total_sales + COALESCE(v_share.fee_sales, 0);

    -- Legacy 'standard' plan rows (created before manual fees)
    IF v_share.investment_plan = 'standard'
       AND COALESCE(v_share.fee_service, 0) = 0
       AND COALESCE(v_share.fee_renovation, 0) = 0
       AND COALESCE(v_share.fee_sales, 0) = 0
       AND v_total_project > 0 THEN
      v_legacy_service := v_legacy_service + ROUND((v_share.amount_paid / v_total_project) * v_service_fee, 2);
      v_legacy_reno := v_legacy_reno + ROUND((v_share.amount_paid / v_total_project) * (v_renovation_cost * 0.10), 2);
    END IF;
  END LOOP;

  IF v_total_invested <= 0 THEN
    RAISE EXCEPTION 'Investidor não possui vínculo com esta propriedade';
  END IF;

  v_total_refund := v_total_invested + v_total_service + v_total_reno + v_total_sales + v_legacy_service + v_legacy_reno;

  DELETE FROM shares WHERE property_id = p_property_id AND user_id = p_user_id;

  UPDATE profiles SET credits = credits + v_total_refund WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
  VALUES (p_user_id, v_total_invested, 'refund', 'Estorno investimento - ' || v_property_title, auth.uid());

  IF (v_total_service + v_total_reno + v_total_sales + v_legacy_service + v_legacy_reno) > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
    VALUES (p_user_id, v_total_service + v_total_reno + v_total_sales + v_legacy_service + v_legacy_reno, 'refund', 'Estorno de taxas - ' || v_property_title, auth.uid());
  END IF;

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

-- Update delete property to refund based on stored fees
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
  v_fees numeric;
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

  FOR v_share IN
    SELECT s.user_id, s.amount_paid, s.investment_plan, s.fee_service, s.fee_renovation, s.fee_sales, p.title as property_title
    FROM shares s
    JOIN properties p ON p.id = s.property_id
    WHERE s.property_id = p_property_id
  LOOP
    v_fees := COALESCE(v_share.fee_service, 0) + COALESCE(v_share.fee_renovation, 0) + COALESCE(v_share.fee_sales, 0);

    -- Legacy 'standard' plan rows
    IF v_share.investment_plan = 'standard'
       AND v_fees = 0
       AND v_total_project > 0 THEN
      v_fees := ROUND((v_share.amount_paid / v_total_project) * v_service_fee, 2)
              + ROUND((v_share.amount_paid / v_total_project) * (v_renovation_cost * 0.10), 2);
    END IF;

    v_total_refund := v_share.amount_paid + v_fees;

    UPDATE profiles SET credits = credits + v_total_refund WHERE user_id = v_share.user_id;

    INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
    VALUES (v_share.user_id, v_share.amount_paid, 'refund', 'Estorno investimento - Exclusão: ' || v_share.property_title, auth.uid());

    IF v_fees > 0 THEN
      INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
      VALUES (v_share.user_id, v_fees, 'refund', 'Estorno de taxas - Exclusão: ' || v_share.property_title, auth.uid());
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
