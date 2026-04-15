-- Mise à jour de la table wallet_transactions pour stocker les détails des prix

-- 1. Ajouter les colonnes manquantes
alter table public.wallet_transactions 
  add column if not exists student_price decimal(10,2) null,
  add column if not exists teacher_revenue decimal(10,2) null,
  add column if not exists platform_commission decimal(10,2) null;

-- 2. Mettre à jour les transactions existantes de type 'earning'
-- Pour les transactions existantes, on calcule les valeurs à partir du montant
UPDATE public.wallet_transactions 
SET 
  teacher_revenue = amount,
  student_price = CASE 
    WHEN amount = 2.00 THEN 3.00
    WHEN amount = 3.50 THEN 5.00
    WHEN amount = 5.50 THEN 7.50
    WHEN amount = 8.50 THEN 11.00
    WHEN amount = 11.00 THEN 14.00
    WHEN amount = 21.00 THEN 26.00
    ELSE amount * 1.35 -- approximation par défaut
  END,
  platform_commission = CASE 
    WHEN amount = 2.00 THEN 1.00
    WHEN amount = 3.50 THEN 1.50
    WHEN amount = 5.50 THEN 2.00
    WHEN amount = 8.50 THEN 2.50
    WHEN amount = 11.00 THEN 3.00
    WHEN amount = 21.00 THEN 5.00
    ELSE amount * 0.35 -- approximation par défaut
  END
WHERE type = 'earning' 
  AND student_price IS NULL;

-- 3. Créer ou mettre à jour la fonction RPC pour créditer le wallet
CREATE OR REPLACE FUNCTION public.credit_wallet_for_course(
  p_teacher_id uuid,
  p_amount decimal,
  p_course_request_id uuid,
  p_description text,
  p_student_price decimal DEFAULT NULL,
  p_platform_commission decimal DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid;
  v_teacher_revenue decimal;
BEGIN
  -- Récupérer l'ID du wallet du professeur
  SELECT id INTO v_wallet_id
  FROM public.teacher_wallets
  WHERE teacher_id = p_teacher_id;

  -- Si le wallet n'existe pas, le créer
  IF v_wallet_id IS NULL THEN
    INSERT INTO public.teacher_wallets (teacher_id, balance, total_earned, total_withdrawn)
    VALUES (p_teacher_id, 0, 0, 0)
    RETURNING id INTO v_wallet_id;
  END IF;

  -- Le montant passé est déjà le revenu prof
  v_teacher_revenue := p_amount;

  -- Mettre à jour le wallet
  UPDATE public.teacher_wallets
  SET 
    balance = balance + v_teacher_revenue,
    total_earned = total_earned + v_teacher_revenue,
    updated_at = timezone('utc', now())
  WHERE id = v_wallet_id;

  -- Créer la transaction avec les détails
  INSERT INTO public.wallet_transactions (
    wallet_id,
    course_request_id,
    type,
    amount,
    student_price,
    teacher_revenue,
    platform_commission,
    description,
    status,
    created_at,
    processed_at
  ) VALUES (
    v_wallet_id,
    p_course_request_id,
    'earning',
    v_teacher_revenue,
    p_student_price,
    v_teacher_revenue,
    p_platform_commission,
    p_description,
    'completed',
    timezone('utc', now()),
    timezone('utc', now())
  );
END;
$$;

-- 4. Vérifier la structure
select column_name, data_type 
from information_schema.columns 
where table_name = 'wallet_transactions' 
order by ordinal_position;
