-- ========================================
-- Supabase Storage: place-images 存储桶
-- ========================================

-- 1. 创建公开存储桶（5MB 限制，仅允许图片）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'place-images',
  'place-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do nothing;

-- 2. RLS 策略：允许所有人读取
DROP POLICY IF EXISTS "Allow public read place-images" ON storage.objects;
CREATE POLICY "Allow public read place-images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'place-images');

-- 3. RLS 策略：允许认证用户上传
DROP POLICY IF EXISTS "Allow authenticated uploads place-images" ON storage.objects;
CREATE POLICY "Allow authenticated uploads place-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'place-images');

-- 4. RLS 策略：允许认证用户删除
DROP POLICY IF EXISTS "Allow authenticated delete place-images" ON storage.objects;
CREATE POLICY "Allow authenticated delete place-images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'place-images');
