-- Enable RLS on wallet tables
ALTER TABLE teacher_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for teacher_wallets
-- Teachers can view their own wallet
DROP POLICY IF EXISTS "Teachers can view own wallet" ON teacher_wallets;
CREATE POLICY "Teachers can view own wallet"
  ON teacher_wallets
  FOR SELECT
  USING (auth.uid() = teacher_id);

-- Teachers can update their own wallet (for withdrawals)
DROP POLICY IF EXISTS "Teachers can update own wallet" ON teacher_wallets;
CREATE POLICY "Teachers can update own wallet"
  ON teacher_wallets
  FOR UPDATE
  USING (auth.uid() = teacher_id);

-- System can insert wallets (via trigger on profile creation)
DROP POLICY IF EXISTS "System can insert wallets" ON teacher_wallets;
CREATE POLICY "System can insert wallets"
  ON teacher_wallets
  FOR INSERT
  WITH CHECK (true);

-- Policies for wallet_transactions
-- Teachers can view their own transactions
DROP POLICY IF EXISTS "Teachers can view own transactions" ON wallet_transactions;
CREATE POLICY "Teachers can view own transactions"
  ON wallet_transactions
  FOR SELECT
  USING (
    wallet_id IN (
      SELECT id FROM teacher_wallets WHERE teacher_id = auth.uid()
    )
  );

-- System can insert transactions (via triggers and RPC functions)
DROP POLICY IF EXISTS "System can insert transactions" ON wallet_transactions;
CREATE POLICY "System can insert transactions"
  ON wallet_transactions
  FOR INSERT
  WITH CHECK (true);

-- System can update transaction status
DROP POLICY IF EXISTS "System can update transactions" ON wallet_transactions;
CREATE POLICY "System can update transactions"
  ON wallet_transactions
  FOR UPDATE
  USING (true);

-- Function to credit wallet when course is completed
CREATE OR REPLACE FUNCTION credit_wallet_for_course(
  p_teacher_id UUID,
  p_amount NUMERIC,
  p_course_request_id UUID,
  p_description TEXT
) RETURNS void AS $$
DECLARE
  v_wallet_id UUID;
BEGIN
  -- Get or create wallet
  SELECT id INTO v_wallet_id
  FROM teacher_wallets
  WHERE teacher_id = p_teacher_id;

  IF v_wallet_id IS NULL THEN
    INSERT INTO teacher_wallets (teacher_id, balance, total_earned, total_withdrawn)
    VALUES (p_teacher_id, 0, 0, 0)
    RETURNING id INTO v_wallet_id;
  END IF;

  -- Create transaction
  INSERT INTO wallet_transactions (
    wallet_id,
    course_request_id,
    type,
    amount,
    description,
    status
  ) VALUES (
    v_wallet_id,
    p_course_request_id,
    'earning',
    p_amount,
    p_description,
    'completed'
  );

  -- Update wallet balance
  UPDATE teacher_wallets
  SET
    balance = balance + p_amount,
    total_earned = total_earned + p_amount,
    updated_at = NOW()
  WHERE id = v_wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing trigger to use the new function
DROP TRIGGER IF EXISTS credit_teacher_wallet_trigger ON course_requests;

CREATE TRIGGER credit_teacher_wallet_trigger
  AFTER UPDATE ON course_requests
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.teacher_id IS NOT NULL)
  EXECUTE FUNCTION credit_teacher_wallet();
