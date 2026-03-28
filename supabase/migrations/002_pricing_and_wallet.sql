-- =============================================
-- Migration: Grille tarifaire et systeme de cagnotte
-- =============================================

-- Table des tarifs par duree
CREATE TABLE IF NOT EXISTS pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duration_minutes INTEGER NOT NULL UNIQUE,
  student_price DECIMAL(10, 2) NOT NULL,
  teacher_revenue DECIMAL(10, 2) NOT NULL,
  platform_commission DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertion de la grille tarifaire
INSERT INTO pricing (duration_minutes, student_price, teacher_revenue, platform_commission) VALUES
  (10, 3.00, 2.00, 1.00),
  (20, 5.00, 3.50, 1.50),
  (30, 7.50, 5.50, 2.00),
  (45, 11.00, 8.50, 2.50),
  (60, 14.00, 11.00, 3.00),
  (120, 26.00, 21.00, 5.00)
ON CONFLICT (duration_minutes) DO UPDATE SET
  student_price = EXCLUDED.student_price,
  teacher_revenue = EXCLUDED.teacher_revenue,
  platform_commission = EXCLUDED.platform_commission,
  updated_at = NOW();

-- Table de la cagnotte des professeurs
CREATE TABLE IF NOT EXISTS teacher_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  total_earned DECIMAL(10, 2) DEFAULT 0.00,
  total_withdrawn DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id)
);

-- Table des transactions de la cagnotte
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES teacher_wallets(id) ON DELETE CASCADE,
  course_request_id UUID REFERENCES course_requests(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('earning', 'withdrawal', 'refund', 'bonus')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter les colonnes de tarification dans course_requests
ALTER TABLE course_requests
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS student_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS teacher_revenue DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS platform_commission DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed'));

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_wallets_teacher_id ON teacher_wallets(teacher_id);
CREATE INDEX IF NOT EXISTS idx_course_requests_payment_status ON course_requests(payment_status);

-- Fonction pour creer automatiquement une cagnotte lors de la creation d'un profil professeur
CREATE OR REPLACE FUNCTION create_teacher_wallet()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'teacher' THEN
    INSERT INTO teacher_wallets (teacher_id)
    VALUES (NEW.id)
    ON CONFLICT (teacher_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour creer la cagnotte automatiquement
DROP TRIGGER IF EXISTS on_teacher_profile_created ON profiles;
CREATE TRIGGER on_teacher_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_teacher_wallet();

-- Creer les cagnottes pour les professeurs existants
INSERT INTO teacher_wallets (teacher_id)
SELECT id FROM profiles WHERE role = 'teacher'
ON CONFLICT (teacher_id) DO NOTHING;

-- Fonction pour crediter la cagnotte du professeur apres un cours complete
CREATE OR REPLACE FUNCTION credit_teacher_wallet()
RETURNS TRIGGER AS $$
DECLARE
  v_wallet_id UUID;
BEGIN
  -- Seulement quand le status passe a 'completed' et qu'il y a un teacher_id
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.teacher_id IS NOT NULL AND NEW.teacher_revenue IS NOT NULL THEN
    -- Trouver ou creer la cagnotte du professeur
    SELECT id INTO v_wallet_id FROM teacher_wallets WHERE teacher_id = NEW.teacher_id;

    IF v_wallet_id IS NULL THEN
      INSERT INTO teacher_wallets (teacher_id) VALUES (NEW.teacher_id)
      RETURNING id INTO v_wallet_id;
    END IF;

    -- Crediter la cagnotte
    UPDATE teacher_wallets
    SET
      balance = balance + NEW.teacher_revenue,
      total_earned = total_earned + NEW.teacher_revenue,
      updated_at = NOW()
    WHERE id = v_wallet_id;

    -- Enregistrer la transaction
    INSERT INTO wallet_transactions (wallet_id, course_request_id, type, amount, description)
    VALUES (
      v_wallet_id,
      NEW.id,
      'earning',
      NEW.teacher_revenue,
      'Cours de ' || NEW.duration_minutes || ' min - ' || NEW.subject
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour crediter automatiquement
DROP TRIGGER IF EXISTS on_course_completed ON course_requests;
CREATE TRIGGER on_course_completed
  AFTER UPDATE ON course_requests
  FOR EACH ROW
  EXECUTE FUNCTION credit_teacher_wallet();

-- Politique RLS pour les cagnottes
ALTER TABLE teacher_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

-- Les professeurs peuvent voir leur propre cagnotte
CREATE POLICY "Teachers can view own wallet" ON teacher_wallets
  FOR SELECT USING (auth.uid() = teacher_id);

-- Les professeurs peuvent voir leurs propres transactions
CREATE POLICY "Teachers can view own transactions" ON wallet_transactions
  FOR SELECT USING (
    wallet_id IN (SELECT id FROM teacher_wallets WHERE teacher_id = auth.uid())
  );

-- Tout le monde peut lire les tarifs
CREATE POLICY "Anyone can read pricing" ON pricing
  FOR SELECT USING (true);

-- Vue pour obtenir le solde complet d'un professeur
CREATE OR REPLACE VIEW teacher_wallet_summary AS
SELECT
  tw.teacher_id,
  tw.balance,
  tw.total_earned,
  tw.total_withdrawn,
  COUNT(wt.id) as total_transactions,
  MAX(wt.created_at) as last_transaction_at
FROM teacher_wallets tw
LEFT JOIN wallet_transactions wt ON tw.id = wt.wallet_id
GROUP BY tw.id, tw.teacher_id, tw.balance, tw.total_earned, tw.total_withdrawn;

-- Commentaires pour documentation
COMMENT ON TABLE pricing IS 'Grille tarifaire des cours par duree';
COMMENT ON TABLE teacher_wallets IS 'Cagnotte des professeurs';
COMMENT ON TABLE wallet_transactions IS 'Historique des transactions de cagnotte';
COMMENT ON COLUMN course_requests.duration_minutes IS 'Duree du cours en minutes';
COMMENT ON COLUMN course_requests.student_price IS 'Prix paye par l eleve';
COMMENT ON COLUMN course_requests.teacher_revenue IS 'Revenu du professeur';
COMMENT ON COLUMN course_requests.platform_commission IS 'Commission de la plateforme';
