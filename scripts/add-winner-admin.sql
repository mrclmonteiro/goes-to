-- ──────────────────────────────────────────────────────────────────
-- 1. Coluna winner em nominations
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE nominations
  ADD COLUMN IF NOT EXISTS winner boolean NOT NULL DEFAULT false;

-- ──────────────────────────────────────────────────────────────────
-- 2. Coluna is_admin em user_profiles
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- ──────────────────────────────────────────────────────────────────
-- 3. Marcar o admin pelo email (busca o id em auth.users)
-- ──────────────────────────────────────────────────────────────────
UPDATE user_profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'mrclmonteiro@icloud.com' LIMIT 1
);

-- ──────────────────────────────────────────────────────────────────
-- 4. RLS: só admins podem marcar vencedores
-- ──────────────────────────────────────────────────────────────────
-- Política de UPDATE restrita a admins
CREATE POLICY "admins can update nominations"
  ON nominations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.is_admin = true
    )
  );
