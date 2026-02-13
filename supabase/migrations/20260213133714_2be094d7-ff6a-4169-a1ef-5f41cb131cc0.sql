
-- Function to handle share purchase atomically
CREATE OR REPLACE FUNCTION public.purchase_share(p_property_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share_price numeric;
  v_available integer;
BEGIN
  -- Lock the property row and get current values
  SELECT share_price, available_shares INTO v_share_price, v_available
  FROM properties
  WHERE id = p_property_id
  FOR UPDATE;

  IF v_available IS NULL THEN
    RAISE EXCEPTION 'Imóvel não encontrado';
  END IF;

  IF v_available <= 0 THEN
    RAISE EXCEPTION 'Não há cotas disponíveis';
  END IF;

  -- Insert the share record
  INSERT INTO shares (property_id, user_id, quantity, amount_paid)
  VALUES (p_property_id, p_user_id, 1, v_share_price);

  -- Decrement available shares
  UPDATE properties
  SET available_shares = available_shares - 1, updated_at = now()
  WHERE id = p_property_id;
END;
$$;
