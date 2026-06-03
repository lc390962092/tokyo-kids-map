-- ========================================n-- 1. playdates 表（溜娃邀约）
-- ========================================
CREATE TABLE IF NOT EXISTS playdates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  meet_at TIMESTAMPTZ NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 3000,
  max_participants INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- 2. playdate_responses 表（报名信息）
-- ========================================
CREATE TABLE IF NOT EXISTS playdate_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playdate_id UUID NOT NULL REFERENCES playdates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(playdate_id, user_id)
);

-- ========================================
-- 3. 附近搜索函数（Haversine，无需 PostGIS）
-- ========================================
CREATE OR REPLACE FUNCTION nearby_playdates(
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION
) RETURNS SETOF playdates AS $$
BEGIN
  RETURN QUERY
  SELECT p.* FROM playdates p
  WHERE p.status = 'active'
    AND p.meet_at > now()
    AND (
      6371000 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(lat)) * cos(radians(p.latitude)) *
          cos(radians(p.longitude) - radians(lon)) +
          sin(radians(lat)) * sin(radians(p.latitude))
        ))
      )
    ) <= radius_meters
  ORDER BY p.meet_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ========================================
-- 4. RLS 策略
-- ========================================
ALTER TABLE playdates ENABLE ROW LEVEL SECURITY;
ALTER TABLE playdate_responses ENABLE ROW LEVEL SECURITY;

-- playdates SELECT：所有人可查看活跃未过期邀约
DROP POLICY IF EXISTS "Playdates are viewable by everyone" ON playdates;
CREATE POLICY "Playdates are viewable by everyone"
  ON playdates FOR SELECT
  TO anon, authenticated
  USING (status = 'active' AND meet_at > now());

-- playdates INSERT：登录用户可创建，且必须是自己
DROP POLICY IF EXISTS "Authenticated users can create playdates" ON playdates;
CREATE POLICY "Authenticated users can create playdates"
  ON playdates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- playdates UPDATE：仅发起人或 admin
DROP POLICY IF EXISTS "Only owner or admin can update playdates" ON playdates;
CREATE POLICY "Only owner or admin can update playdates"
  ON playdates FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  )
  WITH CHECK (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- playdates DELETE：仅发起人或 admin
DROP POLICY IF EXISTS "Only owner or admin can delete playdates" ON playdates;
CREATE POLICY "Only owner or admin can delete playdates"
  ON playdates FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- responses SELECT：所有人可查看
DROP POLICY IF EXISTS "Responses are viewable by everyone" ON playdate_responses;
CREATE POLICY "Responses are viewable by everyone"
  ON playdate_responses FOR SELECT
  TO anon, authenticated
  USING (true);

-- responses INSERT：仅登录用户，且必须是自己
DROP POLICY IF EXISTS "Authenticated users can respond" ON playdate_responses;
CREATE POLICY "Authenticated users can respond"
  ON playdate_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- responses UPDATE/DELETE：仅自己
DROP POLICY IF EXISTS "Users can update their own responses" ON playdate_responses;
CREATE POLICY "Users can update their own responses"
  ON playdate_responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own responses" ON playdate_responses;
CREATE POLICY "Users can delete their own responses"
  ON playdate_responses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
