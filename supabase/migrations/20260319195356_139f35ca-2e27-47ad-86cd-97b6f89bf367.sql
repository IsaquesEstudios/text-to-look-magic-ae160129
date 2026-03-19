
CREATE OR REPLACE FUNCTION public.admin_unlink_investor(
  p_property_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_invested numeric;
  v_service_fee numeric;
  v_total_project numeric;
  v_fee_share numeric;
  v_total_refund numeric;
  v_property_type text;
  v_property_title text;
  v_remaining_shares integer;
  v_is_auction_property boolean;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem desvincular investidores';
  END IF;

  SELECT type, title, COALESCE(estimated_auction_value, 0) + COALESCE(estimated_renovation_cost, 0)
  INTO v_property_type, v_property_title, v_total_project
  FROM properties WHERE id = p_property_id;

  IF v_property_title IS NULL THEN
    RAISE EXCEPTION 'Propriedade não encontrada';
  END IF;

  SELECT COALESCE(SUM(amount_paid), 0) INTO v_total_invested
  FROM shares WHERE property_id = p_property_id AND user_id = p_user_id;

  IF v_total_invested <= 0 THEN
    RAISE EXCEPTION 'Investidor não possui vínculo com esta propriedade';
  END IF;

  IF v_property_type = 'land' OR v_property_type = 'terreno' THEN
    v_service_fee := 500;
  ELSE
    v_service_fee := 5000;
  END IF;

  IF v_total_project > 0 THEN
    v_fee_share := ROUND((v_total_invested / v_total_project) * v_service_fee, 2);
  ELSE
    v_fee_share := 0;
  END IF;

  v_total_refund := v_total_invested + v_fee_share;

  -- Delete this user's shares
  DELETE FROM shares WHERE property_id = p_property_id AND user_id = p_user_id;

  -- Refund credits
  UPDATE profiles SET credits = credits + v_total_refund WHERE user_id = p_user_id;

  -- Log refund transactions
  INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
  VALUES (p_user_id, v_total_invested, 'refund', 'Estorno investimento - ' || v_property_title, auth.uid());

  IF v_fee_share > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
    VALUES (p_user_id, v_fee_share, 'refund', 'Estorno taxa de serviço - ' || v_property_title, auth.uid());
  END IF;

  -- Check if property has any remaining investors
  SELECT COUNT(*) INTO v_remaining_shares FROM shares WHERE property_id = p_property_id;

  -- If no investors left and property was created from an auction, delete the property
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
$$;
