
CREATE OR REPLACE FUNCTION public.admin_delete_property(p_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_share RECORD;
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir propriedades';
  END IF;

  -- Refund each investor's amount_paid (no fees, full refund)
  FOR v_share IN
    SELECT s.user_id, s.amount_paid, p.title as property_title
    FROM shares s
    JOIN properties p ON p.id = s.property_id
    WHERE s.property_id = p_property_id
  LOOP
    -- Add credits back
    UPDATE profiles SET credits = credits + v_share.amount_paid WHERE user_id = v_share.user_id;

    -- Log refund transaction
    INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
    VALUES (v_share.user_id, v_share.amount_paid, 'refund', 'Estorno - Exclusão do imóvel: ' || v_share.property_title, auth.uid());
  END LOOP;

  -- Delete shares
  DELETE FROM shares WHERE property_id = p_property_id;

  -- Delete property images
  DELETE FROM property_images WHERE property_id = p_property_id;

  -- Delete property messages
  DELETE FROM property_messages WHERE property_id = p_property_id;

  -- Delete property expenses
  DELETE FROM property_expenses WHERE property_id = p_property_id;

  -- Delete message reads
  DELETE FROM property_message_reads WHERE property_id = p_property_id;

  -- Delete expense reads
  DELETE FROM property_expense_reads WHERE property_id = p_property_id;

  -- Unlink auction items (set property_id to null instead of deleting)
  UPDATE auction_items SET property_id = NULL WHERE property_id = p_property_id;

  -- Delete the property
  DELETE FROM properties WHERE id = p_property_id;
END;
$$;
