-- ========================================
-- 1. site_settings 表（全局配置）
-- ========================================
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 默认配置
INSERT INTO site_settings (key, value) VALUES
  ('playdates_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- RLS：允许所有人读取，仅管理员可修改
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site settings readable by all" ON site_settings;
CREATE POLICY "Site settings readable by all"
  ON site_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Only admin can update site settings" ON site_settings;
CREATE POLICY "Only admin can update site settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- ========================================
-- 2. playdate_responses 添加 notified 字段（报名通知）
-- ========================================
ALTER TABLE playdate_responses
  ADD COLUMN IF NOT EXISTS notified BOOLEAN NOT NULL DEFAULT false;

-- 报名通知 RLS：发起人可以看到自己邀约的所有未读报名
-- 原有 UPDATE 策略只允许自己更新自己的响应
-- 发起人需要能更新 responses 的 notified 字段
DROP POLICY IF EXISTS "Owner can mark responses as notified" ON playdate_responses;
CREATE POLICY "Owner can mark responses as notified"
  ON playdate_responses FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM playdates WHERE id = playdate_responses.playdate_id
    )
  );
