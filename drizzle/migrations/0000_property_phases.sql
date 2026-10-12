ALTER TABLE public.shares ADD COLUMN IF NOT EXISTS phase text NOT NULL DEFAULT 'purchase';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS sale_doc_cost numeric NOT NULL DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS broker_commission numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.admin_link_investor_phase(p_property_id uuid, p_user_id uuid, p_amount numeric, p_phase text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_credits numeric; v_title text;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Apenas administradores'; END IF;
  IF p_phase NOT IN ('purchase','renovation') THEN RAISE EXCEPTION 'Etapa inválida'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
  SELECT title INTO v_title FROM properties WHERE id = p_property_id;
  IF v_title IS NULL THEN RAISE EXCEPTION 'Propriedade não encontrada'; END IF;
  SELECT credits INTO v_credits FROM profiles WHERE user_id = p_user_id;
  IF v_credits IS NULL THEN RAISE EXCEPTION 'Usuário não encontrado'; END IF;
  IF v_credits < p_amount THEN RAISE EXCEPTION 'Créditos insuficientes. Saldo: $%', round(v_credits,2); END IF;
  INSERT INTO shares (property_id, user_id, quantity, amount_paid, phase) VALUES (p_property_id, p_user_id, 1, p_amount, p_phase);
  UPDATE profiles SET credits = credits - p_amount WHERE user_id = p_user_id;
  INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
  VALUES (p_user_id, -p_amount, 'deposit', CASE WHEN p_phase='purchase' THEN 'Compra - ' ELSE 'Reforma - ' END || v_title, auth.uid());
END; $$;

CREATE OR REPLACE FUNCTION public.admin_update_share_amount(p_share_id uuid, p_new_amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_s RECORD; v_diff numeric; v_credits numeric;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Apenas administradores'; END IF;
  IF p_new_amount IS NULL OR p_new_amount <= 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
  SELECT s.*, p.title INTO v_s FROM shares s JOIN properties p ON p.id = s.property_id WHERE s.id = p_share_id;
  IF v_s.id IS NULL THEN RAISE EXCEPTION 'Vínculo não encontrado'; END IF;
  v_diff := p_new_amount - v_s.amount_paid;
  IF v_diff = 0 THEN RETURN; END IF;
  IF v_diff > 0 THEN
    SELECT credits INTO v_credits FROM profiles WHERE user_id = v_s.user_id;
    IF v_credits < v_diff THEN RAISE EXCEPTION 'Créditos insuficientes. Saldo: $%', round(v_credits,2); END IF;
  END IF;
  UPDATE shares SET amount_paid = p_new_amount WHERE id = p_share_id;
  UPDATE profiles SET credits = credits - v_diff WHERE user_id = v_s.user_id;
  INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
  VALUES (v_s.user_id, -v_diff, CASE WHEN v_diff > 0 THEN 'deposit' ELSE 'refund' END, 'Ajuste de valor - ' || v_s.title, auth.uid());
END; $$;

CREATE OR REPLACE FUNCTION public.admin_remove_share(p_share_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_s RECORD; v_refund numeric;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Apenas administradores'; END IF;
  SELECT s.*, p.title INTO v_s FROM shares s JOIN properties p ON p.id = s.property_id WHERE s.id = p_share_id;
  IF v_s.id IS NULL THEN RAISE EXCEPTION 'Vínculo não encontrado'; END IF;
  v_refund := v_s.amount_paid + COALESCE(v_s.fee_service,0) + COALESCE(v_s.fee_renovation,0) + COALESCE(v_s.fee_sales,0);
  DELETE FROM shares WHERE id = p_share_id;
  UPDATE profiles SET credits = credits + v_refund WHERE user_id = v_s.user_id;
  INSERT INTO credit_transactions (user_id, amount, type, description, created_by)
  VALUES (v_s.user_id, v_refund, 'refund', 'Estorno - ' || v_s.title, auth.uid());
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_link_investor_phase(uuid,uuid,numeric,text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_update_share_amount(uuid,numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_remove_share(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_link_investor_phase(uuid,uuid,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_share_amount(uuid,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_remove_share(uuid) TO authenticated;